const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find getValidCredentials in SharedTokenManager
let idx = 5896135 + 3000; // continue from where we left off
const searchFrom = idx;
// Find getValidCredentials
idx = val.indexOf('getValidCredentials', searchFrom);
let cnt = 0;
while (idx >= 0 && cnt < 3) {
  console.log(`\n=== getValidCredentials at ${idx} ===`);
  console.log(val.substring(Math.max(0, idx-50), idx + 800));
  idx = val.indexOf('getValidCredentials', idx+1);
  cnt++;
}
