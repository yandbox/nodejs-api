const got = require('got')
const chalk = require('chalk')
const db = require('../db')

const defaults = {
  force: false, // 检查 expired
  cache: false,
  json: false
}

module.exports = async function (url, opts) {
  if (opts) {
    opts = Object.assign({}, defaults, opts)
  } else {
    opts = defaults
  }

  const result = await db.get(url)
  const exsits = !!result
  const timespan = 24 * 3600 * 1000 // one day

  let lastModified = ''
  if (exsits) {
    if (opts.cache) return result.content
    if (!opts.force) {
      const expired = Date.now() - result.timestamp > timespan
      if (!expired) return result.content
    }

    lastModified = result.lastModified
  }

  const res = await request(url, lastModified)
  if (!res) return

  if (res.statusCode === 304) {
    await db.updateTimestamp(url)
    return result.content
  }

  const text = res.body
  await db.upsert({
    url,
    content: text,
    lastModified: res.headers['last-modified'],
    exsits
  })

  if (opts.json) {
    return JSON.parse(text)
  }

  return text
}

async function request(url, lastModified) {
  console.log('GET', url)

  let opts = {
    timeout: 60000
  }

  if (lastModified) {
    opts.headers = {
      'If-Modified-Since': lastModified
    }
  }

  let res
  try {
    res = await got(url, opts)
  } catch (err) {
    if (err.statusCode) {
      console.error(chalk.red('%d %s'), err.statusCode, url)
      return
    } else {
      throw err
    }
  }

  if (res.url !== res.requestUrl) {
    console.log(chalk.red('301 %s'), url)
  }

  // console.log('%d %s', res.statusCode, url)
  return res
}

module.exports.defaults = defaults
