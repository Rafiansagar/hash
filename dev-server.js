const http = require('http')
const fs   = require('fs')
const path = require('path')

require('dotenv').config()

const handler = require('./api/hash')

const PORT = 3001

const server = http.createServer((req, res) => {
  if (req.url !== '/api/hash') {
    res.writeHead(404)
    return res.end()
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    try { req.body = JSON.parse(body) } catch { req.body = {} }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      return res.end()
    }

    res.status = code => { res.statusCode = code; return res }
    res.json   = data => res.end(JSON.stringify(data))

    handler(req, res)
  })
})

server.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`))
