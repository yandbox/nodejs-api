#!/usr/bin/env node

const argv = require('yargs-parser')(process.argv.slice(2), {
  alias: {
    help: ['h']
  },
  boolean: ['help']
})

const firstArg = argv._[0]
if (argv.help || !firstArg) {
  showHelp()
}

const page = require('./lib/page')
const help = require('./lib/help')

main(firstArg)

function main(item) {
  if (item === 'help') {
    const topic = argv._[1]
    if (!topic) {
      console.error('Please specify a doc name.')
      return
    }
    help(topic)
    return
  }

  if (item === 'idx') {
    page.createIndex()
    return
  }

  if (item === 'get') {
    const name = argv._[1]
    if (!name) {
      console.error('Please specify a name, e.g. get all or get fs.html')
      return
    }

    if (name === 'all') {
      const ora = require('ora')
      const spinner = ora('Fetching').start()
      page.fetchAll().then(() => { spinner.stop() })
      return
    }

    if (name === 'index.html') {
      page.fetchIndex()
      return
    }

    if (name.endsWith('.html')) {
      page.fetch(name)
      return
    }

    console.error('Invalid name, name should be "all" or end with ".html"')
    return
  }

  console.error('Unknown argument')
}

function showHelp() {
  const cmd = 'napi'
  console.log(`
${cmd} get <all|name>
Download page, e.g. '${cmd} get fs.html'

${cmd} idx
Generate index

${cmd} help <doc>
Open the specified doc, e.g. '${cmd} help fs'
`)
  process.exit()
}
