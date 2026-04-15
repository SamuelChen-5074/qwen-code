import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import OpenAI from 'openai';

const creds = JSON.parse(await readFile(join(homedir(), '.qwen', 'oauth_creds.json'), 'utf-8'));

const orig = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).includes('chat')) {
    console.log('URL:', url);
    const h = {};
    new Headers(opts?.headers || {}).forEach((v, k) => { h[k] = v; });
    console.log('Headers:', JSON.stringify(h, null, 2));
    console.log('Body:', String(opts?.body || '').substring(0, 500));
  }
  return orig(url, opts);
};

const client = new OpenAI({
  apiKey: creds.access_token,
  baseURL: 'https://portal.qwen.ai/v1',
  maxRetries: 0,
  defaultHeaders: { 'X-DashScope-AuthType': 'qwen-oauth' },
});
try {
  await client.chat.completions.create({ model: 'coder-model', messages: [{ role: 'user', content: 'hi' }] });
} catch(e) { console.log('Error:', e.status, e.message); }
