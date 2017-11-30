const db = require('sqlite')
const { storage } = require('./paths')

let p = db.open(storage)
  .then(() => db.run(`
CREATE TABLE IF NOT EXISTS Pages (
  url TEXT PRIMARY KEY NOT NULL UNIQUE,
  content TEXT,
  lastModified TEXT,
  timestamp INTEGER
)
`))

exports.get = function (url) {
  return p.then(() => db.get('SELECT * FROM Pages WHERE url = ?', url))
}

exports.upsert = async function (data) {
  let exists = data.exists
  if (exists == null) exists = await has(data.url)
  await (exists ? update(data) : add(data))
}

async function has(url) {
  return p.then(() => db.get('SELECT url FROM Pages WHERE url = ?', url))
    .then(result => !!result)
}

function add(data) {
  return p.then(() => db.run(`
  INSERT INTO Pages (url, content, lastModified, timestamp)
  VALUES ($url, $content, $lastModified, $timestamp)
  `, transform(data)))
}

function update(data) {
  return p.then(() => db.run(`
  UPDATE Pages
  SET content = $content, lastModified = $lastModified, timestamp = $timestamp
  WHERE url = $url
  `, transform(data)))
}

function transform(data) {
  const ret = {
    $timestamp: Date.now()
  };
  ['url', 'content', 'lastModified'].forEach(key => ret['$' + key] = data[key])
  return ret
}

exports.updateTimestamp = async function (url) {
  return p.then(() => db.run(`
  UPDATE Pages
  SET timestamp = $timestamp
  WHERE url = $url
  `,
    {
      $url: url,
      $timestamp: Date.now()
    }
  ))
}
