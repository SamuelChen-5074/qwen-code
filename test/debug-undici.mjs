import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { Agent } from 'undici';
import OpenAI from 'openai';

const creds = JSON.parse(await readFile(join(homedir(), '.qwen', 'oauth_creds.json'), 'utf-8'));
const token = creds.access_token;
const baseURL = 'https://portal.qwen.ai/v1';
const UA = 'QwenCode/0.10.0 (win32; x64)';

// Use undici Agent with headersTimeout:0/bodyTimeout:0, exactly as CLI does
const dispatcher = new Agent({ headersTimeout: 0, bodyTimeout: 0 });

const client = new OpenAI({
  apiKey: token,
  baseURL,
  timeout: 120_000,
  maxRetries: 0,
  defaultHeaders: {
    'User-Agent': UA,
    'X-DashScope-UserAgent': UA,
    'X-DashScope-CacheControl': 'enable',
    'X-DashScope-AuthType': 'qwen-oauth',
  },
  fetchOptions: { dispatcher },
});

console.log('Testing with undici Agent (CLI-identical setup)...');
try {
  const res = await client.chat.completions.create({
    model: 'coder-model',
    messages: [{ role: 'user', content: '用一句话介绍你自己' }],
    max_tokens: 8000,
    // @ts-ignore DashScope metadata
    metadata: { sessionId: 'test-123', promptId: 'test-456' },
  });
  console.log('回复:', res.choices[0].message.content);
  console.log('用量:', res.usage);
} catch(e) {
  console.log('Error:', e.status, e.message);
}
