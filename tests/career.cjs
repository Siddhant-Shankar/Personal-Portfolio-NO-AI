// Test helper: load career-data.js (a browser script) in Node.
const vm = require('node:vm'),
  fs = require('node:fs'),
  path = require('node:path'),
  sandbox = { window: {} };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '..', 'dist', 'career-data.js'), 'utf8'),
  sandbox,
);
module.exports = sandbox.window.CAREER;
