const fs = require('fs');
const content = fs.readFileSync('C:/Users/samuelchen/AppData/Roaming/npm/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find getCurrentEndpoint
let idx = content.indexOf('getCurrentEndpoint');
if (idx >= 0) {
  console.log('--- getCurrentEndpoint ---');
  console.log(content.substring(Math.max(0, idx - 50), idx + 600));
} else {
  console.log('getCurrentEndpoint not found, searching /v1 suffix logic...');
  idx = content.indexOf('endsWith');
  while (idx >= 0) {
    const snip = content.substring(idx, idx + 100);
    if (snip.includes('v1')) {
      console.log(content.substring(Math.max(0, idx - 100), idx + 200));
      break;
    }
    idx = content.indexOf('endsWith', idx + 1);
  }
}
