import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';

const creds = JSON.parse(await readFile(join(homedir(), '.qwen', 'oauth_creds.json'), 'utf-8'));
const body = JSON.stringify({
  model: 'coder-model',
  messages: [{ role: 'user', content: [{ type: 'text', text: 'say hi' }] }],
});

const tests = [
  ['bare minimum', {
    'Authorization': 'Bearer ' + creds.access_token,
    'Content-Type': 'application/json',
  }],
  ['+ AuthType header', {
    'Authorization': 'Bearer ' + creds.access_token,
    'Content-Type': 'application/json',
    'X-DashScope-AuthType': 'qwen-oauth',
  }],
  ['+ x-request-id', {
    'Authorization': 'Bearer ' + creds.access_token,
    'Content-Type': 'application/json',
    'X-DashScope-AuthType': 'qwen-oauth',
    'x-request-id': randomUUID(),
  }],
  ['+ all DashScope headers', {
    'Authorization': 'Bearer ' + creds.access_token,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-DashScope-AuthType': 'qwen-oauth',
    'X-DashScope-CacheControl': 'enable',
    'X-DashScope-UserAgent': 'QwenCode/0.10.0 (win32; x64)',
    'User-Agent': 'QwenCode/0.10.0 (win32; x64)',
    'x-request-id': randomUUID(),
  }],
];

for (const [name, headers] of tests) {
  const res = await fetch('https://portal.qwen.ai/v1/chat/completions', { method: 'POST', headers, body });
  const text = await res.text();
  console.log(`[${name}]: ${res.status} ${text.substring(0, 80)}`);
}
