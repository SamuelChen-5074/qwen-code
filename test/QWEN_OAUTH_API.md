# Qwen Code OAuth API 调用指南

本文档记录了对 `qwen-code` 项目 API 调用机制的逆向研究成果，包含完整的 OAuth 认证流程、接口调用要求，以及在外部项目中复现相同调用所需的全部细节。

---

## 目录

1. [架构概览](#架构概览)
2. [OAuth 认证流程](#oauth-认证流程)
3. [凭据文件格式](#凭据文件格式)
4. [API 调用规则（已验证）](#api-调用规则已验证)
5. [必须满足的隐性要求](#必须满足的隐性要求)
6. [完整示例代码](#完整示例代码)
7. [常见错误排查](#常见错误排查)
8. [安全机制分析](#安全机制分析)

---

## 架构概览

```
qwen-code CLI
  └── QwenContentGenerator           # packages/core/src/qwen/qwenContentGenerator.ts
        └── OpenAIContentGenerator   # 基类，封装 openai SDK
              └── DashScopeOpenAICompatibleProvider
                    ├── buildClient()    → new OpenAI({ baseURL, defaultHeaders })
                    ├── buildHeaders()   → X-DashScope-* 头
                    └── buildRequest()   → 追加 metadata、temperature
```

**技术栈：**
- HTTP 客户端：`openai` npm SDK（v4.x）
- 底层传输：`undici`（Node.js 内置，通过 `Agent({ headersTimeout:0, bodyTimeout:0 })` 配置）
- API 端点：`portal.qwen.ai`（OpenAI 兼容接口）
- 认证：OAuth 2.0 Device Flow + PKCE（S256）

---

## OAuth 认证流程

使用标准 **OAuth 2.0 设备授权流（Device Authorization Grant，RFC 8628）**，并附加 PKCE 防止授权码拦截。

### 步骤 1：生成 PKCE 对

```js
import crypto from 'crypto';

const codeVerifier  = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
// code_challenge_method = 'S256'
```

### 步骤 2：请求设备码

```
POST https://chat.qwen.ai/api/v1/oauth2/device/code
Content-Type: application/x-www-form-urlencoded

client_id=f0304373b74a44d2b584a3fb70ca9e56
&scope=openid profile email model.completion
&code_challenge=<base64url(SHA256(codeVerifier))>
&code_challenge_method=S256
```

响应：

```json
{
  "device_code": "...",
  "user_code": "ABCD-EFGH",
  "verification_uri": "https://chat.qwen.ai/authorize",
  "verification_uri_complete": "https://chat.qwen.ai/authorize?user_code=ABCD-EFGH",
  "expires_in": 1800,
  "interval": 5
}
```

### 步骤 3：用户在浏览器完成授权

引导用户访问 `verification_uri_complete`，在浏览器中登录并授权。

### 步骤 4：轮询换取 Token

每 5 秒轮询一次（`interval` 字段指定）：

```
POST https://chat.qwen.ai/api/v1/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&client_id=f0304373b74a44d2b584a3fb70ca9e56
&device_code=<device_code>
&code_verifier=<原始 codeVerifier，非 hash>
```

轮询响应状态：

| 响应字段 | 含义 | 处理方式 |
|----------|------|----------|
| `access_token` 存在 | 授权成功 | 保存凭据，停止轮询 |
| `status: "pending"` | 用户未授权 | 继续等待 |
| `error: "authorization_pending"` | 同上（另一种格式） | 继续等待 |
| `error: "slow_down"` | 轮询过快 | 增加间隔后继续 |
| 其他 `error` | 真正失败 | 终止并报错 |

成功响应：

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 21600,
  "resource_url": "portal.qwen.ai"
}
```

### 步骤 5：刷新 Token

Access token 有效期约 6 小时（21600 秒），到期前使用 refresh token 续期：

```
POST https://chat.qwen.ai/api/v1/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=<refresh_token>
&client_id=f0304373b74a44d2b584a3fb70ca9e56
```

> **⚠️ 重要：** Refresh token **一次性使用**。调用后旧 refresh token 立即失效，响应中会返回新的 refresh token，必须保存替换。手动调用刷新接口会导致 qwen CLI 的 token 失效。

---

## 凭据文件格式

文件路径：`~/.qwen/oauth_creds.json`

```json
{
  "access_token": "_MiiXDlvlVmZCnoH_...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "resource_url": "portal.qwen.ai",
  "expiry_date": 1776257266881
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | string | Bearer Token，直接用于 Authorization 头 |
| `refresh_token` | string | 刷新用，**单次使用** |
| `token_type` | string | 固定 `"Bearer"` |
| `resource_url` | string | API 域名，**不含协议和路径**（如 `portal.qwen.ai`） |
| `expiry_date` | number | Unix 毫秒时间戳，推荐提前 30 秒刷新 |

---

## API 调用规则（已验证）

### 端点

```
resource_url 转换规则（来自 getCurrentEndpoint()）：
  portal.qwen.ai  →  https://portal.qwen.ai/v1

聊天接口：
  POST https://portal.qwen.ai/v1/chat/completions
```

### 模型名称

| 认证类型 | 模型名 |
|----------|--------|
| qwen-oauth | `coder-model` |
| vision 任务 | `vision-model` |

> `coder-model` 实际映射至 `qwen3.6-plus`（从响应 `model` 字段观察到）。

### 请求头

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-DashScope-AuthType: qwen-oauth        ← 必须
X-DashScope-UserAgent: QwenCode/x.x.x (win32; x64)  ← 必须（见下方说明）
X-DashScope-CacheControl: enable        ← 可选（开启 prefix cache）
User-Agent: QwenCode/x.x.x (win32; x64) ← 可选
```

### 请求体

```json
{
  "model": "coder-model",
  "messages": [
    { "role": "system", "content": "系统提示词" },
    { "role": "user",   "content": "用户消息" }
  ]
}
```

流式请求额外加 `"stream": true`。

---

## 必须满足的隐性要求

以下两条规则**未出现在任何文档或错误提示中**，但通过系统测试验证为必须条件——缺失时服务返回 `400 bad request`：

### 规则 1：`X-DashScope-UserAgent` 头必须存在

这是一个 DashScope 专用请求头，**不能用标准 `User-Agent` 替代**。

```
# ✅ 成功
X-DashScope-UserAgent: QwenCode/0.10.0 (win32; x64)

# ❌ 400 bad request（即使有 User-Agent 也不行）
（缺少 X-DashScope-UserAgent）
```

测试结果（固定其他条件，仅改变 UA 头）：

| 请求头组合 | HTTP 状态 |
|-----------|-----------|
| `Auth + Content-Type + X-DashScope-AuthType` | 400 |
| `Auth + Content-Type + X-DashScope-UserAgent` | 400 |
| `Auth + Content-Type + User-Agent` | 400 |
| `Auth + Content-Type + X-DashScope-AuthType + User-Agent` | 400 |
| `Auth + Content-Type + X-DashScope-AuthType + X-DashScope-UserAgent` | **200** ✅ |

### 规则 2：`messages` 数组必须包含 `system` 消息

`portal.qwen.ai` 的 qwen-oauth 端点要求消息列表中至少有一条 `role: "system"` 消息。

```json
// ✅ 成功
"messages": [
  { "role": "system", "content": "任意系统提示，内容不限" },
  { "role": "user",   "content": "用户消息" }
]

// ❌ 400 bad request
"messages": [
  { "role": "user", "content": "仅用户消息" }
]
```

测试结果（使用正确请求头）：

| 消息结构 | HTTP 状态 |
|---------|-----------|
| 仅 user（string 内容） | 400 |
| 仅 user（array 内容） | 400 |
| system + user（string 内容） | **200** ✅ |
| system + user（array 内容） | **200** ✅ |

> system 消息的具体内容不受限制，任意字符串均可通过验证。

---

## 完整示例代码

见 [test-oauth.mjs](./test-oauth.mjs)，包含：
- Token 读取与自动刷新
- URL 规范化
- 非流式请求
- 流式请求（SSE）

快速启动：

```bash
# 1. 首次登录（浏览器授权）
node test/oauth-login.mjs

# 2. 调用 API
node test/test-oauth.mjs
```

依赖：

```json
{
  "type": "module",
  "dependencies": {
    "openai": "^4.0.0"
  }
}
```

---

## 常见错误排查

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `400 bad request` | 缺少 `X-DashScope-UserAgent` 头，或缺少 `system` 消息 | 补充两个必须条件 |
| `model 'xxx' is not supported` | 模型名错误 | 使用 `coder-model` |
| `Invalid URL` | `resource_url` 不含协议 | 拼接 `https://` 前缀和 `/v1` 后缀 |
| Token 突然失效 | 手动调用了 refresh 端点 | Refresh token 单次有效，重新运行 `oauth-login.mjs` |
| `401 Unauthorized` | Access token 过期 | 触发 token 刷新逻辑 |
| 请求超时无响应 | 未配置 undici Agent | 参考 CLI 源码使用 `undici.Agent({ headersTimeout:0, bodyTimeout:0 })` |

---

## 安全机制分析

### 使用的机制

**PKCE（Proof Key for Code Exchange）**
- 仅在登录阶段保护授权码不被中间人截获
- 一旦 access_token 发出，PKCE 不再提供保护

**Refresh Token 单次使用**
- 每次刷新后旧 refresh_token 立即失效
- 若凭据泄露并被他人抢先刷新，原用户下次刷新失败可感知到入侵

**Access Token 短期有效**
- 有效期约 6 小时（expires_in: 21600）

### 不存在的机制

经源码分析确认，以下机制**均未实现**：

- ❌ 设备绑定（无 machineId / deviceId 校验）
- ❌ IP 绑定
- ❌ DPoP（Demonstration of Proof of Possession）
- ❌ Token 绑定（RFC 8471）

**结论：** 在 access_token 有效期内，拥有 `~/.qwen/oauth_creds.json` 文件的任何人均可直接调用 API，服务端不会拒绝。务必保护该文件的访问权限。

---

## 参考的源码文件

| 文件 | 关键逻辑 |
|------|---------|
| `packages/core/src/qwen/qwenOAuth2.ts` | OAuth 流程、PKCE 生成、设备码轮询 |
| `packages/core/src/qwen/sharedTokenManager.ts` | Token 缓存、刷新、文件锁 |
| `packages/core/src/qwen/qwenContentGenerator.ts` | `getCurrentEndpoint()`、`executeWithCredentialManagement()` |
| `packages/core/src/core/openaiContentGenerator/provider/dashscope.ts` | `buildHeaders()`、`buildRequest()`、`buildMetadata()` |
| `packages/core/src/core/openaiContentGenerator/provider/default.ts` | `buildFetchOptionsWithDispatcher()`（undici Agent） |
| `packages/core/src/config/models.ts` | `DEFAULT_QWEN_MODEL = "coder-model"` |
