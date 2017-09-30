const fs = require('fs')
const path = require('path')
const opn = require('opn')
const { docsPath } = require('./config')

module.exports = function (topic) {
  const name = topic.endsWith('.html') ? topic : topic + '.html'
  const fullname = path.join(docsPath, name)
  if (!fs.existsSync(fullname)) {
    console.error('Cannot find the file:', name)
    return
  }
  opn(fullname)
}
