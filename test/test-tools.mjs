import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const creds = JSON.parse(await readFile(join(homedir(), '.qwen', 'oauth_creds.json'), 'utf-8'));
const headers = {
  'Authorization': 'Bearer ' + creds.access_token,
  'Content-Type': 'application/json',
  'X-DashScope-AuthType': 'qwen-oauth',
};

// Try 1: empty tools array
const res1 = await fetch('https://portal.qwen.ai/v1/chat/completions', {
  method: 'POST', headers,
  body: JSON.stringify({ model: 'coder-model', messages: [{ role: 'user', content: [{ type: 'text', text: 'say hi' }] }], tools: [] }),
});
console.log('empty tools:', res1.status, (await res1.text()).substring(0, 150));

// Try 2: with one dummy tool
const res2 = await fetch('https://portal.qwen.ai/v1/chat/completions', {
  method: 'POST', headers,
  body: JSON.stringify({
    model: 'coder-model',
    messages: [{ role: 'user', content: [{ type: 'text', text: 'say hi' }] }],
    tools: [{ type: 'function', function: { name: 'dummy', description: 'dummy', parameters: { type: 'object', properties: {} } } }]
  }),
});
console.log('with tool:', res2.status, (await res2.text()).substring(0, 300));
