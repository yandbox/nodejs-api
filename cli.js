#!/usr/bin/env node

const arg = process.argv[2]
if (!arg || arg.startsWith('-')) {
  showHelp()
}
main(arg)

function main(arg) {
  if (arg === 'get') {
    require('./lib/get')().catch(console.error)
    return
  }

  console.error('Unknown argument')
}

function showHelp() {
  console.log(`Usage: node cli.js <command>

Commands:

get     Download pages
`)
  process.exit()
}
