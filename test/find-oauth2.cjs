const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Find the full qwenOAuth2 section - look for device_code flow
let idx = val.indexOf('isDeviceTokenSuccess');
console.log('\n=== isDeviceTokenSuccess at:', idx, '===');
if (idx >= 0) {
  console.log(val.substring(Math.max(0, idx-200), idx+2000));
}
