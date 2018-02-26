/**
 * GET page
 *
 * caching 避免重复请求
 *
 * cache=1 检查 expired，若过期则重新下载
 * cache=2 不检查 expired，直接使用 cache
 *
 * redirect
 * 当站内 redirect 比较多，不替换 href，会影响阅读。
 * 这时要记录 redirect
 *
 *
 */

const got = require('got')
const chalk = require('chalk')
const db = require('./db')

const options = {
  cache: 1,
  timespan: 24 * 3600 * 1000, // one day
  got: {
    timeout: 30000,
    followRedirect: false
  }
}

/**
 * @param {string} url
 * @return {object}
 */
async function get(url) {
  /**
   * cache
   */

  // data 是 return value
  // data.content 是 page html
  let data = {}
  try {
    const data = await db.get(url)
    if (options.cache === 1) {
      if (Date.now() - data.date < options.timespan) return data
    } else if (options.cache === 2) {
      return data
    }
  } catch (err) {
    if (err.notFound) {
      if (options.cache === 2) {
        console.error(chalk.red('Not found in cache: %s'), url)
        return data
      }
    } else {
      throw err
    }
  }

  /**
   * request
   */

  const gotOptions = options.got
  if ('content' in data) {
    gotOptions.headers = {
      'If-Modified-Since': data.lastModified
    }
  }

  let res
  try {
    console.log('GET', url)
    res = await got(url, gotOptions)
  } catch (err) {
    // 404 配合 cache=2 可以不发起请求
    const { statusCode } = err
    if (statusCode) {
      console.error(chalk.red('%d %s'), err.statusCode, url)
      data = {
        statusCode,
      }
      if (statusCode === 404) {
        save(url, data)
      }
      return data
    }
    throw err
  }

  const { statusCode } = res

  if (statusCode === 304) {
    save(url, data)
    return data
  }

  // 一般没有 redirct
  // 3xx 配合 cache=2 可以不发起请求
  if (statusCode > 299 & statusCode < 400) {
    console.log(chalk.red('%d %s'), statusCode, url)
    console.log(chalk.red('%d %s'), '-->', res.headers['location'])
    data = {
      location: res.headers['location'],
      statusCode,
    }
  } else {
    data = {
      content: res.body,
      lastModified: res.headers['last-modified'],
    }
  }

  // no await
  save(url, data)
  return data
}

function save(key, data) {
  data.date = Date.now()
  db.put(key, data)
}

module.exports = get
module.exports.options = options
