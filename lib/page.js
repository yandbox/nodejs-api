const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const cheerio = require('cheerio')
const got = require('got')
const mkdirp = require('mkdirp')
const pMap = require('p-map')

const writeFile = promisify(fs.writeFile)

exports.fetchAll = async function all(ver) {
  const dest = ensureDir(ver)
  // 第一步：下载首页，获取页面列表
  const list = await fetchIndex(ver, dest)
  // 第二步：下载全部页面，搜集它们的 TOC
  const results = await pMap(list,
    page => fetchPage(page),
    { concurrency: 5 })
  // flatten
  const arr = [].concat(...results)

  await writeFile(path.join(dest, 'data.js'),
    'var links = ' + JSON.stringify(arr), 'utf8')
}

exports.fetchOne = async function (ver, name) {
  const dest = ensureDir(ver)

  if (name === 'index.html') {
    await fetchIndex(ver, dest)
    return
  }

  await fetchPage(createPageData(name, ver, dest))
}

function ensureDir(ver) {
  const dest = path.join(__dirname, '../docs', ver)
  mkdirp.sync(dest)
  return dest
}

function createPageData(name, ver, dest) {
  const home = `https://nodejs.org/dist/${ver}/docs/api/`
  return {
    name,
    url: home + name,
    dest: path.join(dest, name),
    home
  }
}

function fetchIndex(ver, dest) {
  const pageName = 'index.html'
  const page = createPageData(pageName, ver, dest)

  return got(page.url, { timeout: 5000 })
    .then(res => {
      // 修改页面
      const $ = modify(res.body, page)
      // 从页面边栏获取页面列表
      const files = []
      $('#column2').find('a')
        .each(function (i, el) {
          const name = $(el).attr('href')
          if (name === '/' || name.startsWith('http')) return
          files.push(createPageData(name, ver, dest))
        })

      // 保存页面，然后返回页面列表
      return writeFile(page.dest, modifyHTML($.html()), 'utf8')
        .then(() => writeFile(page.dest.replace(pageName, 'files.json'),
          JSON.stringify(files, null, 2), 'utf8'))
        .then(() => files)
    })
}

function fetchPage(page) {
  const pageName = page.name
  // 网络不好，调大 timeout
  return got(page.url, { timeout: 8000 })
    .then(res => {
      // 修改页面
      var $ = modify(res.body, page)

      // 边栏当前页面
      // #nav-list 是 modify() 添加的
      $('#nav-list').find('.nav-' + pageName.slice(0, -5)).addClass('active')

      // 收集 TOC
      const items = $('#toc').find('a')
        .map(function (i, el) {
          var $el = $(el)
          return {
            text: $el.text(),
            href: pageName + $el.attr('href')
          }
        })
        .get()

      return writeFile(page.dest, modifyHTML($.html()), 'utf8')
        .then(() => items)
    })
    .catch(function (err) {
      console.log(`fetch ${pageName} failed`)
      console.log(err.stack)
    })
}

/**
 * 修改页面
 *
 * @param {string} htmlString
 * @param {object} page
 */
function modify(htmlString, page) {
  const $ = cheerio.load(htmlString)

  $('#intro > a').attr('href', 'https://nodejs.org/')

  // 如果页面改版了，可能需要修改 selectors
  $('#column2').children('ul').eq(1).attr('id', 'nav-list')
    .before('<div id="search"><input type="search" id="search-input"></div>',
    '<ul id="search-list"></ul>'
    )

  // 删除 google fonts
  $('link').eq(0).remove()

  // 添加一些链接
  $('#gtoc').find('a').each(function (i, el) {
    if (!i) return
    $(el).attr('href', page.home + $(el).attr('href'))
  })
  $('#gtoc').children('p').append(` | <a href="${page.url}">View the Original</a> | <a href="https://github.com/yanxyz/nodejs-api">About</a>`)

  // 添加 custom assets
  // 不同的版本共享 assets
  $('head').append('<link rel="stylesheet" href="../assets-custom/style.css" />')

  $('body').append(
    '<script src="data.js" defer></script>',
    '<script src="../assets/zepto.min.js" defer></script>',
    '<script src="../assets-custom/script.js" defer></script>'
  )

  return $
}

function modifyHTML(html) {
  // 不同的版本共享 assets
  return html.replace(/="(assets\/)/g, '="../$1')
}
