const path = require('path')

const root = path.join(__dirname, '..')
const output = path.join(root, 'public')

function resolve(s1, s2 = '') {
  return path.resolve(output, s1, s2)
}

module.exports = {
  storage: path.join(root, 'pages.db'),
  resolve,
}
