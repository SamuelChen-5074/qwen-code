const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find SharedTokenManager class implementation
let idx = val.indexOf('SharedTokenManager');
let cnt = 0;
while (idx >= 0 && cnt < 2) {
  const ctx = val.substring(idx, idx + 3000);
  if (ctx.includes('getValidCredentials') || ctx.includes('class')) {
    console.log(`\n=== SharedTokenManager at ${idx} ===`);
    console.log(ctx);
    break;
  }
  idx = val.indexOf('SharedTokenManager', idx + 1);
  cnt++;
}
