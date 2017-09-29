/*global DATA*/

/**
 * 返回 TOC
 */

$('#apicontent').querySelectorAll('.mark').forEach(a => {
  a.insertAdjacentHTML('beforebegin',
    `<a href="${a.getAttribute('href')}" class="mark to-toc">&upuparrows;</a>`)
})

$('#apicontent').addEventListener('click', function (e) {
  const el = e.target
  if (el.className.endsWith(' to-toc')) {
    e.preventDefault()
    $('#toc')
      .querySelector(`a[href="${el.getAttribute('href')}"]`)
      .scrollIntoView()
  }
})

/**
 * 搜索
 */

var $sidebar = $('#column2')
var $input = $('#search-input')

$input.addEventListener('input', function (e) {
  const val = this.value.trim()
  query(val)
})

document.addEventListener('keydown', function (e) {
  // `/` 定位搜索框
  if (e.keyCode === 191 && e.target.tagName.toLowerCase() !== 'input') {
    setTimeout(function () {
      $input.focus()
    }, 0)
  }
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

function $(s) {
  return document.querySelector(s)
}
