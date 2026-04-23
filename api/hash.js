const crypto = require('crypto')

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' })
  }

  const salt      = process.env.HASH_SALT || ''
  const saltedHash = crypto.createHmac('md5', salt).update(text).digest('hex')
  const plainHash  = crypto.createHash('md5').update(text).digest('hex')

  res.json({ saltedHash, plainHash })
}
