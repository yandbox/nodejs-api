const minimist = require('minimist')

module.exports = function (argv, opts) {
  if (!argv) {
    argv = process.argv.slice(3)
  } else if (typeof argv === 'object') {
    opts = argv
    argv = process.argv.slice(3)
  }

  const args = minimist(argv, opts)
  return args
}
