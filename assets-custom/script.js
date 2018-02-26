/*global DATA*/

function $(s) {
  return document.querySelector(s)
}

/**
 * 返回 TOC
 */

const $content = $('#apicontent')

$content.querySelectorAll('.mark').forEach(a => {
  a.insertAdjacentHTML('beforebegin',
    `<a href="${a.getAttribute('href')}" class="mark to-toc">&upuparrows;</a>`)
})

$content.addEventListener('click', function (e) {
  const el = e.target
  if (el.classList.contains('to-toc')) {
    e.preventDefault()
    e.stopPropagation()
    $('#toc')
      .querySelector(`a[href="${el.getAttribute('href')}"]`)
      .scrollIntoView()
  }
})

/**
 * 搜索
 */

const $sidebar = $('#column2')
const $input = $('#search-input')

$input.addEventListener('input', function (e) {
  const val = this.value.trim()
  query(val)
})

$('#search-list').addEventListener('click', function (e) {
  if (e.target.tagName === 'A') {
    query()
    $sidebar.querySelector('.active').scrollIntoView()
  }
})

function query(kw) {
  if (!kw) {
    $sidebar.classList.remove('searching')
    return
  }

  kw = kw.toLowerCase()
  $sidebar.classList.add('searching')
  const list = DATA.filter(x => x.text.toLowerCase().includes(kw))
  $('#search-list').innerHTML = list
    .map(x => `<li><a href="${x.href}">${x.text}</a></li>`)
    .join('\n')
}

/**
 * 页面链接使用 nodejs.org 地址，这样复制链接才有意义
 */

window.onload = function () {
  const base = document.createElement('base')
  base.href = document.querySelector('link[rel="canonical"]').href
  document.head.appendChild(base)
}

const local = (function () {
  const href = window.location.href
  const arr = href.split('/')
  return {
    root: arr.slice(0, -1).join('/')
  }
})()

document.addEventListener('click', function (e) {
  let a
  if (e.target.tagName !== 'A') {
    a = e.target.closest('a')
    if (a == null) return
  } else {
    a = e.target
  }

  const { href } = a
  // https://nodejs.org/api/fs.html
  // root/fs.html
  // 有一些链接，比如 all.html, *.json，基本不会用到
  // 这里不做处理，需要时通过右键菜单打开
  if (href.startsWith('https://nodejs.org/api/')) {
    let url = local.root + href.slice(href.lastIndexOf('/'))
    if (location.origin === 'file://') {
      url = url.replace(/\/(#|$)/, '/index.html$1')
    }
    window.location.assign(url)
    e.preventDefault()
  }
})

document.addEventListener('keydown', function (e) {
  if (e.target.tagName.toLowerCase() === 'input') return
  switch (e.code) {
    // `/` 定位搜索框
    case 'Slash':
      setTimeout(function () {
        $input.focus()
      }, 0)
      break
    // `h` 返回首页
    case 'KeyH':
      window.location.assign(local.root)
      break
  }
})
