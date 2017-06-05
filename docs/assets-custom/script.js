/*global links*/

var className = 'active'

/**
 * 搜索
 */

var $sidebar = $('#column2')
var $input = $('#search-input')
  .on('input', function (e) {
    var val = this.value.trim()
    query(val)
  })

$(document).on('keydown', function (e) {
  // ESC 清空搜索框
  if (e.which === 27) {
    if ($input.val()) {
      $input.val('')
      query('')
    }
    return
  }

  // / 定位搜索框
  if (e.which === 191 && e.target.tagName.toLowerCase() !== 'input') {
    setTimeout(function () {
      $input.focus()
    }, 0)
  }
})

var $searchList = $('#search-list')
  .on('click', 'a', function (e) {
    var $this = $(this)

    if ($this.hasClass(className)) {
      return false
    }

    $searchList.find('.' + className).removeClass(className)
    $(this).addClass(className)
  })

/**
 * 返回 TOC
 */

$('#apicontent')
  .on('click', '.to-toc', function () {
    document.getElementById('toc')
      .querySelector('a[href="' + $(this).attr('href') + '"]')
      .scrollIntoView()
    return false
  })
  .find('.mark').each(function () {
    var html = '<a href="' + $(this).attr('href') +
      '" class="mark to-toc">&upuparrows;</a>'
    $(this).after(html)
  })

function template(data) {
  return data.map(function (x) {
    return '<li><a href="' + x.href + '">' + x.text + '</a></li>'
  }).join('')
}

function query(kw) {
  if (!kw) {
    $sidebar.removeClass('searching')
  } else {
    kw = kw.toLowerCase()
    $sidebar.addClass('searching')

    var data = links.filter(function (x) {
      return x.text.toLowerCase().indexOf(kw) > -1
    })

    $searchList.html(template(data))
  }
}
