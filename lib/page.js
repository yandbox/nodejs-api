const fs = require('fs-extra')
const cheerio = require('cheerio')
const pMap = require('p-map')
const { resolve } = require('./paths')
const get = require('./utils/get')

// 收集页面 TOC
const data = []
// 忽略这些页面的 TOC
const tocignore = [
  'index.html',
  'documentation.html',
  'synopsis.html',
  'cli.html',
  'debugger.html',
  'deprecations.html',
  'domain.html',
  'esm.html',
  'intl.html',
  'punycode.html',
  'tracing.html',
]

module.exports = async function (pageName, opts) {
  if (opts.force) {
    get.defaults.force = true
  }
  if (opts.cache) {
    get.defaults.cache = true
  }

  if (!pageName) {
    return fetchAll()
  }

  if (!pageName.endsWith('.html')) pageName += '.html'
  return fetch(new Page(pageName))
}

class Page {
  constructor(pageName) {
    this.name = pageName
    // 有多种地址
    // https://nodejs.org/dist/latest/docs/api/
    this.url = 'https://nodejs.org/api/' + (pageName === 'index.html' ? '' : pageName)
    this.file = resolve(pageName)
  }
}

/**
 * 下载全部页面
 */

async function fetchAll() {
  // 先下载首页
  const $ = await fetch(new Page('index.html'))

  // 然后从首页边栏中提取 TOC
  const set = new Set()
  $('#column2').find('a').each(function (i, el) {
    const pageName = $(el).attr('href')
    if (pageName.includes('/')) return
    set.add(pageName)
  })

  // 下载全部页面
  await pMap(set, pageName => fetch(new Page(pageName)), { concurrency: 5 })
  // 将 json 保存为 data.js
  await fs.outputFile(resolve('assets', 'data.js'), 'var DATA = ' + JSON.stringify(data))
}

/**
 * 下载单个页面
 */

async function fetch(page) {
  const html = await get(page.url)
  const $ = modify(html, page)
  await fs.writeFile(page.file, $.html())
  return $
}

function modify(html, page) {
  const $ = cheerio.load(html)

  // Remove google fonts
  $('link').eq(0).remove()

  $('#intro > a').attr('href', 'https://nodejs.org/')

  // Modify sidebar
  const $uls = $('#column2').children('ul')
  $uls.eq(1)
    .attr('id', 'nav-list')
    .before(`
    <div id="search">
      <input type="search" id="search-input" placeholder="filter" autocomplete="false">
    </div>
    <ul id="search-list"></ul>
    `)
  $uls.eq(-1)
    .append('<li><a href="https://github.com/yanxyz/nodejs-api">About this repo</a></li>')

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

  // Extract toc
  addToc($, page.name)

  return $
}

function addToc($, pageName) {
  if (tocignore.includes(pageName)) return

  $('#toc').find('a').each(function (i, el) {
    const $el = $(el)
    data.push({
      text: $el.text(),
      href: pageName + $el.attr('href')
    })
  })
}
