const parseArgs = require('./utils/parse-args')
const fetchAssets = require('./assets')
const fetch = require('./page')

module.exports = async function () {
  const argv = parseArgs()

  const name = argv._[0]
  if (!name) {
    showHelp()
  }

  if (name === 'assets') {
    return fetchAssets()
  }

  if (name === 'all') {
    return fetchAssets().then(() => fetch(null, argv))
  }

  return fetch(name, argv)
}

function showHelp() {
  console.log(`
Usage:

get assets
get all
get <page>

Examples:

get fs --force
Download "fs.html" and bypass the cache
`)

  process.exit(1)
}
