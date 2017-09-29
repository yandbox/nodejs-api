const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const got = require('got')
const makeDir = require('make-dir')
const pMap = require('p-map')
const config = require('./config')

const urlPrefix = 'https://nodejs.org/dist/latest/docs/api/'
const docsDir = path.join(__dirname, '../docs')
const assetsDir = path.join(docsDir, 'assets')
const filesJSON = path.join(assetsDir, 'files.json')
makeDir.sync(assetsDir)

module.exports = {
  fetch,
  fetchIndex,
  fetchAll,
  createIndex
}

async function fetchAll() {
  await fetchIndex()
  const files = require(filesJSON)
  await pMap(Object.keys(files), fetch, { concurrency: 5 })
  createIndex()
}

async function fetch(name) {
  const html = await getHTML(name)
  const $ = modify(html, name)
  fs.writeFileSync(path.join(docsDir, name), $.html())
}

async function fetchIndex() {
  const name = 'index.html'
  const html = await getHTML(name)
  const $ = modify(html, name)
  fs.writeFileSync(path.join(docsDir, name), $.html())

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
  fs.writeFileSync(filesJSON, JSON.stringify(files, null, 2))
}

function getHTML(name) {
  return got(urlPrefix + name, { timeout: 8000 })
    .then(res => res.body)
}

function modify(html, name) {
  const $ = cheerio.load(html)

  // 删除 google fonts
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

  // 删除 assets
  const $scripts = $('script')
  const n = $scripts.length
  $scripts.eq(n - 1).remove()
  $scripts.eq(n - 2).remove()

  // 添加 assets
  $('head').append('<link rel="stylesheet" href="assets-custom/style.css">')
  $('body').append(
    '<script src="assets/data.js" defer></script>',
    '<script src="assets-custom/script.js" defer></script>'
  )

  return $
}

function createIndex() {
  const files = require(filesJSON)
  const excludes = config.tocignore
  const data = []

  Object.keys(files).slice(2) // 忽略开头两个文件
    .forEach(function (name) {
      // excludes 指定的页面，只提供页面标题，不提取 TOC
      if (excludes.includes(name)) {
        data.push(files[name])
        return
      }

      const html = fs.readFileSync(path.join(docsDir, name), 'utf8')
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
