const download = require('./utils/download')
const { resolve } = require('./paths')

module.exports = async function (opts) {
  const baseurl = 'https://nodejs.org/api/assets/'
  const files = [
    'style.css',
    'sh.css',
    'sh_main.js',
    'sh_javascript.min.js',
  ]

  return Promise.all(files.map(name => download(
    baseurl + name,
    resolve('assets', name),
  )))
}
