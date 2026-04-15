const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find the qwen buildRequest with metadata/sessionId
let idx = 0;
let found = [];
while (true) {
  idx = val.indexOf('sessionId', idx);
  if (idx < 0) break;
  const ctx = val.substring(Math.max(0, idx-300), idx+300);
  if (ctx.includes('metadata') || ctx.includes('promptId')) {
    found.push({ idx, ctx });
  }
  idx++;
}
console.log('Found', found.length, 'sessionId occurrences with metadata context');
found.slice(0, 3).forEach(f => {
  console.log('\n=== at', f.idx, '===');
  console.log(f.ctx);
});

// Find max_tokens in request building context
idx = 0;
found = [];
while (true) {
  idx = val.indexOf('max_tokens', idx);
  if (idx < 0) break;
  const ctx = val.substring(Math.max(0, idx-200), idx+200);
  if (ctx.includes('request') || ctx.includes('coder') || ctx.includes('qwen')) {
    found.push({ idx, ctx });
    if (found.length >= 5) break;
  }
  idx++;
}
console.log('\nFound', found.length, 'max_tokens in request context');
found.slice(0, 2).forEach(f => {
  console.log('\n=== at', f.idx, '===');
  console.log(f.ctx);
});
