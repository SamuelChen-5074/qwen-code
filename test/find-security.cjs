const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Look for device ID, machine ID, fingerprint, binding mechanisms
const keywords = ['deviceId', 'device_id', 'machineId', 'machine_id', 'fingerprint', 'X-Device', 'X-Machine', 'clientId', 'client_id', 'getDeviceId', 'hardwareId'];
for (const kw of keywords) {
  let idx = val.indexOf(kw);
  let cnt = 0;
  while (idx >= 0 && cnt < 3) {
    const ctx = val.substring(Math.max(0, idx-100), idx+300);
    // Filter for relevant contexts (auth, headers, request)
    if (ctx.match(/auth|header|token|request|oauth|credential/i)) {
      console.log(`\n=== ${kw} at ${idx} ===`);
      console.log(ctx);
    }
    idx = val.indexOf(kw, idx+1);
    cnt++;
  }
}

// Look for what happens with Authorization header - any signing or transformation?
let idx = val.indexOf('Authorization');
let cnt = 0;
while (idx >= 0 && cnt < 5) {
  const ctx = val.substring(Math.max(0, idx-100), idx+300);
  if (ctx.match(/qwen|oauth|token|sign|hmac|Bearer/i)) {
    console.log(`\n=== Authorization at ${idx} ===`);
    console.log(ctx);
  }
  idx = val.indexOf('Authorization', idx+1);
  cnt++;
}
