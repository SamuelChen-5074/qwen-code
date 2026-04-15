import OpenAI from 'openai';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';

const CREDS_PATH = join(homedir(), '.qwen', 'oauth_creds.json');
const OAUTH_TOKEN_URL = 'https://chat.qwen.ai/api/v1/oauth2/token';
const CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
const TOKEN_BUFFER_MS = 30_000; // 30s buffer before expiry

// 1. 读取凭据，如需要则刷新 token（与项目 SharedTokenManager 逻辑一致）
async function getValidCredentials() {
  let creds;
  try {
    creds = JSON.parse(await readFile(CREDS_PATH, 'utf-8'));
  } catch {
    throw new Error('未找到 OAuth 凭据，请先运行: qwen auth login');
  }

  if (!creds.access_token || !creds.refresh_token) {
    throw new Error('凭据格式无效，请重新运行: qwen auth login');
  }

  // 检查 token 是否即将过期（30s buffer）
  const needsRefresh = !creds.expiry_date || Date.now() >= creds.expiry_date - TOKEN_BUFFER_MS;
  if (!needsRefresh) {
    console.log(`Token 有效，过期时间: ${new Date(creds.expiry_date).toISOString()}`);
    return creds;
  }

  console.log('Token 过期，正在刷新...');
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: creds.refresh_token,
    client_id: CLIENT_ID,
  });
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Token 刷新失败: ${JSON.stringify(data)}\n请重新运行: qwen auth login`);
  }

  // 保存新凭据到文件（与 SharedTokenManager 行为一致）
  const newCreds = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || creds.refresh_token,
    token_type: data.token_type || 'Bearer',
    resource_url: data.resource_url || creds.resource_url,
    expiry_date: Date.now() + (data.expires_in || 3600) * 1000,
  };
  await writeFile(CREDS_PATH, JSON.stringify(newCreds, null, 2));
  console.log(`Token 刷新成功，新过期时间: ${new Date(newCreds.expiry_date).toISOString()}`);
  return newCreds;
}

// 2. 规范化 resource_url → https://xxx/v1（与 getCurrentEndpoint() 逻辑一致）
function buildBaseURL(resourceUrl) {
  const withProtocol = resourceUrl.startsWith('http') ? resourceUrl : `https://${resourceUrl}`;
  return withProtocol.endsWith('/v1') ? withProtocol : `${withProtocol}/v1`;
}

// --- 主流程 ---
const creds = await getValidCredentials();
const baseURL = buildBaseURL(creds.resource_url);
const VERSION = '0.1.0';
const UA = `QwenCode/${VERSION} (${process.platform}; ${process.arch})`;

console.log(`\nendpoint: ${baseURL}`);

// 3. 使用 openai SDK（与项目 DashScopeOpenAICompatibleProvider.buildClient() 完全一致）
// portal.qwen.ai 要求：
//   - 必须有 X-DashScope-AuthType: qwen-oauth
//   - 必须有 X-DashScope-UserAgent（非标准 User-Agent）
//   - 每次请求必须包含 system 消息
const client = new OpenAI({
  apiKey: creds.access_token,
  baseURL,
  timeout: 120_000,
  maxRetries: 0,
  defaultHeaders: {
    'User-Agent': UA,
    'X-DashScope-UserAgent': UA,          // 必须：portal.qwen.ai 验证此头
    'X-DashScope-CacheControl': 'enable',
    'X-DashScope-AuthType': 'qwen-oauth', // 必须：告知端点使用 OAuth 认证
  },
});

const SESSION_ID = randomUUID();

// 4. 非流式请求
// 注意：portal.qwen.ai 要求 messages 中必须包含 system 消息，否则返回 400
console.log('\n--- 非流式请求 ---');
const res = await client.chat.completions.create({
  model: 'coder-model',
  messages: [
    { role: 'system', content: '你是 Qwen Code，一个 AI 编程助手。' },
    { role: 'user', content: '用一句话介绍你自己' },
  ],
});
console.log('回复:', res.choices[0].message.content);
console.log('用量:', res.usage);

// 5. 流式请求
console.log('\n--- 流式请求 ---');
const stream = await client.chat.completions.create({
  model: 'coder-model',
  messages: [
    { role: 'system', content: '你是 Qwen Code，一个 AI 编程助手。' },
    { role: 'user',   content: '写一首两句话的短诗' },
  ],
  stream: true,
});
process.stdout.write('回复: ');
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}
console.log('\n完成');
