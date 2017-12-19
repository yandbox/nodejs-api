const fs = require('fs-extra')
const path = require('path')
const cheerio = require('cheerio')
const request = require('./utils/request')
const download = require('./utils/download')
const pMap = require('p-map')

// 有多种地址
// https://nodejs.org/dist/latest/docs/api/
const indexUrl = 'https://nodejs.org/api/'

// 收集页面 TOC
const tocList = []

// 忽略这些页面的 TOC
const tocIgnore = [
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

class Page {
  constructor(pageName) {
    this.name = pageName
    this.url = indexUrl + (pageName === 'index.html' ? '' : pageName)
    this.file = resolve(pageName)
  }
}

function resolve(name) {
  return path.join(__dirname, '../public', name)
}

async function fetchAll() {
  // 先下载首页
  const $ = await fetch(new Page('index.html'))

  // 页面 assets
  const assets = new Map()
  $('link').each(function (i, el) {
    const value = el.attribs.href
    if (value.startsWith('http') || value.startsWith('assets-custom/')) return
    assets.set(value, {
      url: indexUrl + value,
      file: resolve(value)
    })
  })
  $('script').each(function (i, el) {
    const value = el.attribs.src
    if (!value || value.startsWith('http') ||
      value === 'assets/data.js' ||
      value.startsWith('assets-custom/')
    ) return
    assets.set(value, {
      url: indexUrl + value,
      file: resolve(value)
    })
  })

  if (process.env['NODE_ENV'] === 'test') {
    console.log(assets)
    return
  }

  assets.forEach(item => download(item.url, item.file))

  // 从首页边栏中提取 TOC
  const set = new Set()
  $('#column2').find('a').each(function (i, el) {
    const pageName = $(el).attr('href')
    if (pageName.includes('/')) return
    set.add(pageName)
  })

  // 下载全部页面
  await pMap(set, pageName => fetch(new Page(pageName)), { concurrency: 5 })
  // 将 json 保存为 data.js
  await fs.outputFile(resolve('assets/data.js'), 'var DATA = ' + JSON.stringify(tocList))
}

async function fetch(page) {
  const html = await request(page.url)
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
  if (tocIgnore.includes(pageName)) return

  $('#toc').find('a').each(function (i, el) {
    const $el = $(el)
    tocList.push({
      text: $el.text(),
      href: pageName + $el.attr('href')
    })
  })
}

function run() {
  const arg = process.argv[2]
  if (!arg) {
    console.log('one argument is required: all | <url>')
    return
  }

  if (arg === 'all') {
    if (process.argv[3] === '-t') process.env['NODE_ENV'] = 'test'
    return fetchAll().catch(console.log)
  }

  if (/^https?:/.test(arg)) {
    if (arg.startsWith(indexUrl)) {
      const pageName = arg.slice(indexUrl.length) || 'index.html'
      return fetch(new Page(pageName)).catch(console.log)
    }
    console.log('invalid url')
    return
  }

  console.log('Unknown argument')
}

run()
