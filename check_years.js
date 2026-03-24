const fs = require('fs');
const content = fs.readFileSync('src/data/ayt_mat.js', 'utf8');
const yrs = content.match(/"yr": (\d+)/g).map(x => x.split(' ')[1]);
console.log([...new Set(yrs)].sort());
