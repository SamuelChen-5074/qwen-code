const fs = require('fs');
const val = fs.readFileSync('C:/Users/samuelchen/AppData/Local/fnm_multishells/53768_1768900782996/node_modules/@qwen-code/qwen-code/cli.js', 'utf-8');

// Read from position 5942381 (2000 bytes past start of QwenContentGenerator)
const startPos = 5942381;
console.log(val.substring(startPos, startPos + 3000));
