const cp = require('child_process');
const fs = require('fs');

console.log("Starting webpack build...");
try {
  cp.execSync('npx react-scripts build', { stdio: 'pipe' });
  console.log("Success");
} catch(e) {
  const out = (e.stdout ? e.stdout.toString() : '') + '\n' + (e.stderr ? e.stderr.toString() : '');
  fs.writeFileSync('webpack_error_dump.txt', out);
  console.log("Error written to webpack_error_dump.txt");
}
