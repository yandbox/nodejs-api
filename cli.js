#!/usr/bin/env node

const page = require('./lib/page')

const ver = process.argv[2]
if (!ver || ['-h', '--help'].includes(ver)) {
  console.log(`
Usage: ./cli.js <version>

version is 0 or greater than 3:

0       latest
8       latest-v8.x
8.0.0   v8.0.0
`)
  process.exit()
}

const result = handleVer(ver)
// console.log(result)
if (!result.valid) {
  console.error(result.message)
  process.exit()
}

// 第二个参数为页面名字，表示只下载这个页面，主要是为了测试
const name = process.argv[3]
const dist = result.dist
if (name) {
  if (name.endsWith('.html')) {
    page.fetchOne(dist, name)
  } else {
    console.log("Page name does not end with '.html'")
  }
} else {
  page.fetchAll(dist)
}

function handleVer(ver) {
  const m = ver.match(/^(\d+)(\.\d+\.\d+)?$/)
  // console.log(m)
  if (!m) return {
    valid: false,
    message: 'invalid version'
  }

  const n = Number(m[1])
  if (!m[2]) {
    if (n === 0) return {
      valid: true,
      dist: 'latest'
    }

    if (n > 3) return {
      valid: true,
      dist: `latest-v${n}.x`
    }
  } else {
    if (n > 3) return {
      valid: true,
      dist: `v${ver}`
    }
  }

  return {
    valid: false,
    message: 'only supports v4+'
  }
}
