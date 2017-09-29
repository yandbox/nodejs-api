#!/usr/bin/env node

const name = process.argv[2]
if (!name || ['-h', '--help'].includes(name)) {
  console.log(`
node cli.js all
fetch all pages

node cli.js index.html
fetch index.html

node cli.js idx
generate index
`)
  process.exit()
}

const ora = require('ora')
const page = require('./lib/page')

run(name)

function run(name) {
  if (name === 'idx') {
    page.createIndex()
    return
  }

  if (name === 'all') {
    const spinner = ora('Fetching').start()
    page.fetchAll().then(() => { spinner.stop() })
    return
  }

  if (name === 'index.html') {
    page.fetchIndex()
    return
  }

  page.fetch(name)
}
