const path = require('path')

module.exports = {
  // 忽略这些文件的 toc
  tocignore: [
    // 'documentation.html',
    // 'synopsis.html',
    'cli.html',
    'debugger.html',
    'deprecations.html',
    'domain.html',
    'esm.html',
    'intl.html',
    'punycode.html',
    'tracing.html',
  ],
  docsPath: path.join(__dirname, '../docs'),
}
