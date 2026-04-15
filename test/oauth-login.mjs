import crypto from 'crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

const res = await fetch('https://chat.qwen.ai/api/v1/oauth2/device/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'x-request-id': crypto.randomUUID() },
  body: new URLSearchParams({ client_id: CLIENT_ID, scope: 'openid profile email model.completion', code_challenge: challenge, code_challenge_method: 'S256' }).toString(),
});
const data = await res.json();
console.log('\n请在浏览器打开以下 URL 完成登录：');
console.log(data.verification_uri_complete);
console.log('\n等待授权中...');

for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const pollRes = await fetch('https://chat.qwen.ai/api/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:device_code', client_id: CLIENT_ID, device_code: data.device_code, code_verifier: verifier }).toString(),
  });
  const poll = await pollRes.json();
  if (poll.access_token) {
    const creds = {
      access_token: poll.access_token,
      refresh_token: poll.refresh_token,
      token_type: poll.token_type || 'Bearer',
      resource_url: poll.resource_url,
      expiry_date: Date.now() + (poll.expires_in || 3600) * 1000,
    };
    await writeFile(join(homedir(), '.qwen', 'oauth_creds.json'), JSON.stringify(creds, null, 2));
    console.log('\n登录成功！resource_url:', poll.resource_url);
    process.exit(0);
  } else if (poll.status === 'pending' || poll.error === 'authorization_pending' || poll.error === 'slow_down') {
    // authorization_pending = 用户还未在浏览器确认, slow_down = 轮询过快
    process.stdout.write('.');
  } else {
    console.log('\n轮询出现意外错误:', JSON.stringify(poll));
    process.exit(1);
  }
}
console.log('\n超时，请重试');
