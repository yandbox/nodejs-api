const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const cheerio = require('cheerio')
const got = require('got')
const makeDir = require('make-dir')
const pMap = require('p-map')
const { tocignore, docsPath } = require('./config')

const urlPrefix = 'https://nodejs.org/dist/latest/docs/api/'
const assetsDir = path.join(docsPath, 'assets')
const filesJSON = path.join(assetsDir, 'files.json')

const writeFile = promisify(fs.writeFile)
makeDir.sync(assetsDir)

module.exports = {
  fetch,
  fetchIndex,
  fetchAll,
  createIndex
}

/**
 * 下载全部页面
 */
async function fetchAll() {
  await fetchIndex()
  const files = require(filesJSON)
  await pMap(Object.keys(files), fetch, { concurrency: 5 })
  createIndex()
}

/**
 * 下载单个页面
 *
 * 在 cli 中下载单个页面（避免重新下载全部页面或者用于测试），之后注意重建索引
 */
async function fetch(name) {
  const html = await getHTML(name)
  const $ = modify(html, name)
  await writeFile(path.join(docsPath, name), $.html())
}

/**
 * 下载首页
 *
 * 首页的边栏有全部页面的链接，将这些链接数据保存到 files.json
 * files.json 用于重建索引
 */
async function fetchIndex() {
  const name = 'index.html'
  const html = await getHTML(name)
  const $ = modify(html, name)
  await writeFile(path.join(docsPath, name), $.html())

  const files = {}
  $('#column2').find('a')
    .each(function (i, el) {
      const name = $(el).attr('href')
      if (name.includes('/')) return
      files[name] = {
        text: $(el).text(),
        href: name
      }
    })
  await writeFile(filesJSON, JSON.stringify(files, null, 2))
}

/**
 * 获取页面源码
 *
 * @private
 */
function getHTML(name) {
  return got(urlPrefix + name, {
    timeout: 8000, // 网络不好，超时设定大一些
  })
    .then(res => res.body)
}

/**
 * 修改页面
 *
 * @private
 */
function modify(html, name) {
  const $ = cheerio.load(html)

  // Remove google fonts
  $('link').eq(0).remove()

  $('#intro > a').attr('href', 'https://nodejs.org/')

  // sidebar
  $('#column2').children('ul').eq(1)
    .attr('id', 'nav-list')
    .before(`<div id="search">
      <input type="search" id="search-input" placeholder="filter" autocomplete="false">
    </div>
    <ul id="search-list"></ul>
    `)

  // nav
  const $child = $('#gtoc').children().eq(0)
  const tagName = $child.prop('tagName')
  if (tagName === 'UL') { // ver >= 8.5.0
    const $list = $child.children()
    $list.eq(1).remove()
    $list.eq(2).remove()

    $child.append(`<li> | <a href="${urlPrefix + name}">View the original</a></li>
    <li> | <a href="https://github.com/yanxyz/nodejs-api">About</a></li>`)
  } else if (tagName === 'p') {
    $child.html(`<a href="index.html" name="toc">Index</a> |
      <a href="${urlPrefix + name}">View the original</a> |
      <a href="https://github.com/yanxyz/nodejs-api">About</a>
    `)
  }

  // Remove assets
  const $scripts = $('script')
  const n = $scripts.length
  $scripts.eq(n - 1).remove()
  $scripts.eq(n - 2).remove()

  // Add assets
  $('head').append('<link rel="stylesheet" href="assets-custom/style.css">')
  $('body').append(
    '<script src="assets/data.js" defer></script>',
    '<script src="assets-custom/script.js" defer></script>'
  )

  return $
}

/**
 * 创建索引
 *
 * 从下载的页面中提取它们的 TOC，保存到 data.js，供页面引入
 */
function createIndex() {
  const files = require(filesJSON)
  const data = []

  Object.keys(files)
    .slice(2) // 忽略开头两个文件
    .forEach(function (name) {
      // 对于 tocignore 指定的页面，不提取它们的 TOC
      if (tocignore.includes(name)) {
        data.push(files[name])
        return
      }

      const html = fs.readFileSync(path.join(docsPath, name), 'utf8')
      const $ = cheerio.load(html)
      const items = $('#toc').find('a')
        .map(function (i, el) {
          var $el = $(el)
          return {
            text: $el.text(),
            href: name + $el.attr('href')
          }
        })
        .get()
      data.push(...items)
    })

  fs.writeFileSync(path.join(assetsDir, 'data.js'), 'var DATA = ' + JSON.stringify(data))
}
