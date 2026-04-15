const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find fetchOptions/dispatcher usage near qwen-related code
const patterns = ['fetchOptions', 'dispatcher', 'headersTimeout', 'bodyTimeout', 'buildRuntimeFetch'];
for (const p of patterns) {
  let idx = val.indexOf(p);
  let cnt = 0;
  while (idx >= 0 && cnt < 3) {
    const ctx = val.substring(Math.max(0, idx-100), idx+300);
    if (ctx.includes('qwen') || ctx.includes('Qwen') || ctx.includes('OpenAI') || ctx.includes('undici') || ctx.includes('Agent')) {
      console.log(`\n=== ${p} at ${idx} ===`);
      console.log(ctx);
    }
    idx = val.indexOf(p, idx+1);
    cnt++;
  }
}

// Find undici Agent setup
let idx = val.indexOf('headersTimeout');
let cnt = 0;
while (idx >= 0 && cnt < 5) {
  console.log(`\n=== headersTimeout at ${idx} ===`);
  console.log(val.substring(Math.max(0, idx-200), idx+300));
  idx = val.indexOf('headersTimeout', idx+1);
  cnt++;
}
