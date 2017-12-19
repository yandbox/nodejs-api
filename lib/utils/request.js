const got = require('got')
const chalk = require('chalk')
const db = require('./db')

const options = {
  cache: 1,
  timespan: 24 * 3600 * 1000, // one day
  // got options
  timeout: 30000
}

/**
 * request html
 *
 *
 * @param {string} url
 * @return {string}
 */
module.exports = async function (url) {
  /**
   * handle cache
   *
   * db
   * lastModified
   * savedAt
   *
   * 分为以下情况
   * 1. 使用 cache
   *    1.1 检查 expired，这是默认情况 (cache = 1)
   *    1.2 不检查 expired (cache = 2)
   * 1.2 不检查 expired (cache = 0)
   *
   */

  let data
  try {
    const data = await db.get(url)
    if (options.cache === 1) {
      if (Date.now() - data.savedAt < options.timespan) return data.content
    } else if (options.cache === 2) {
      return data.content
    }
  } catch (err) {
    if (err.notFound) {
      if (options.cache === 2) {
        console.error(chalk.red('Not found in cache: %s'), url)
        return
      }
    } else {
      throw err
    }
  }

  /**
   * request
   */

  const gotOptions = {
    timeout: options.timeout
  }
  if (data && data.lastModified) {
    gotOptions.headers = {
      'If-Modified-Since': data.lastModified
    }
  }

  let res
  try {
    console.log('GET', url)
    res = await got(url, gotOptions)
  } catch (err) {
    if (err.statusCode) {
      console.error(chalk.red('%d %s'), err.statusCode, url)
      return
    }
    throw err
  }

  if (res.statusCode === 304) {
    data.savedAt = Date.now()
    db.put(url, data)
    return data.content
  }

  if (res.url !== res.requestUrl) {
    console.log(chalk.red('%d %s'), res.statusCode, url)
  }

  // 有意不 await
  db.put(url, {
    content: res.body,
    lastModified: res.headers['last-modified'],
    savedAt: Date.now()
  })

  return res.body
}

module.exports.options = options
