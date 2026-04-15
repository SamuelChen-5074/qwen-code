const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find buildRuntimeFetchOptions implementation
let idx = val.indexOf('buildRuntimeFetchOptions');
let cnt = 0;
while (idx >= 0 && cnt < 10) {
  const ctx = val.substring(Math.max(0, idx-100), idx+500);
  if (ctx.includes('function') || ctx.includes('=>') || ctx.includes('Agent') || ctx.includes('dispatcher')) {
    console.log(`\n=== buildRuntimeFetchOptions at ${idx} ===`);
    console.log(ctx);
  }
  idx = val.indexOf('buildRuntimeFetchOptions', idx+1);
  cnt++;
}

// Find buildFetchOptionsWithDispatcher
idx = val.indexOf('buildFetchOptionsWithDispatcher');
cnt = 0;
while (idx >= 0 && cnt < 10) {
  const ctx = val.substring(Math.max(0, idx-100), idx+500);
  if (ctx.includes('function') || ctx.includes('=>') || ctx.includes('Agent') || ctx.includes('new') || ctx.includes('headersTimeout')) {
    console.log(`\n=== buildFetchOptionsWithDispatcher at ${idx} ===`);
    console.log(ctx);
  }
  idx = val.indexOf('buildFetchOptionsWithDispatcher', idx+1);
  cnt++;
}
