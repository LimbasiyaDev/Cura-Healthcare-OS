const fs = require('fs'); 
let lines = fs.readFileSync('app/doctor/page.js', 'utf8').split('\n'); 
lines[646] = '                  {doctor?.is_available ? "Online — Click to Go Offline" : "Offline — Click to Go Online"}'; 
fs.writeFileSync('app/doctor/page.js', lines.join('\n'));
