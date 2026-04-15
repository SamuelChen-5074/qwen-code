const fs = require('fs');
const content = fs.readFileSync('C:/Users/samuelchen/AppData/Roaming/npm/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');
const m = content.match(/VERSION\s*=\s*"4\.\d+\.\d+"/);
console.log('openai version match:', m && m[0]);
// Find openai SDK version reference
const idx = content.indexOf('"4.');
console.log('4.x ref:', content.substring(idx, idx + 30));
