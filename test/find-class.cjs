const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find the Qwen content generator and its auth handling
// Look for the section that handles qwen-oauth token
let idx = val.indexOf('QwenContentGenerator');
console.log('QwenContentGenerator at:', idx);
if (idx >= 0) {
  console.log(val.substring(Math.max(0,idx-50), idx+2000));
}
