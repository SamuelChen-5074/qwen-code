const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Search for PKCE-related code in the qwen OAuth section
const pkce_keywords = ['code_verifier', 'code_challenge', 'PKCE', 'pkce', 'S256'];
for (const kw of pkce_keywords) {
  let idx = val.indexOf(kw);
  let cnt = 0;
  while (idx >= 0 && cnt < 3) {
    console.log(`\n=== ${kw} at ${idx} ===`);
    console.log(val.substring(Math.max(0, idx-200), idx+300));
    idx = val.indexOf(kw, idx+1);
    cnt++;
  }
}

// Search for any token binding or validation beyond Bearer
const binding = ['tokenBinding', 'token_binding', 'dpop', 'DPoP', 'proof', 'nonce', 'jti', 'jku'];
for (const kw of binding) {
  let idx = val.indexOf(kw);
  if (idx >= 0) {
    console.log(`\n=== ${kw} at ${idx} ===`);
    console.log(val.substring(Math.max(0, idx-100), idx+300));
  }
}

// Check what qwenOAuth2 sends during token exchange 
let idx = val.indexOf('qwenOAuth2');
if (idx < 0) idx = val.indexOf('QwenOAuth2');
if (idx < 0) idx = val.indexOf('qwen-oauth2');
console.log('\n=== qwenOAuth2 at:', idx, '===');
if (idx >= 0) {
  console.log(val.substring(Math.max(0, idx-50), idx+2000));
}
