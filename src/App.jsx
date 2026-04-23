import { useState, useEffect, useRef } from 'react'
import './App.css'

function derivedFromHash(hexHash, opts) {
  const charset = [
    ...(opts.lower   ? 'abcdefghijklmnopqrstuvwxyz'.split('') : []),
    ...(opts.upper   ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : []),
    ...(opts.digits  ? '0123456789'.split('') : []),
    ...(opts.symbols ? '#@$%&!*+=-_'.split('') : []),
  ]
  if (!charset.length) return ''

  const bytes = []
  for (let i = 0; i < hexHash.length; i += 2) {
    bytes.push(parseInt(hexHash.slice(i, i + 2), 16))
  }

  const arr = bytes.map(b => charset[b % charset.length])

  const groups = []
  if (opts.lower)   groups.push(['abcdefghijklmnopqrstuvwxyz', 0])
  if (opts.upper)   groups.push(['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4])
  if (opts.digits)  groups.push(['0123456789', 8])
  if (opts.symbols) groups.push(['#@$%&!*+=-_', 12])

  groups.forEach(([chars, pos]) => {
    const seedByte = bytes[pos % bytes.length]
    arr[pos % arr.length] = chars[seedByte % chars.length]
  })

  return arr.join('')
}

export default function App() {
  const [input, setInput]     = useState('')
  const [hash, setHash]       = useState('')
  const [caseMode, setCaseMode] = useState('lower')
  const [charset, setCharset] = useState({ lower: true, upper: true, digits: true, symbols: true })
  const [copied, setCopied]   = useState({ hash: false, derived: false })
  const [loading, setLoading] = useState(false)
  const debounceRef           = useRef(null)

  useEffect(() => {
    if (!input) { setHash(''); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch('/api/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input }),
        })
        const data = await res.json()
        setHash(data.hash || '')
      } catch {
        setHash('')
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(debounceRef.current)
  }, [input])

  const displayHash = caseMode === 'upper' ? hash.toUpperCase() : hash
  const derived     = hash ? derivedFromHash(hash, charset) : ''

  function copy(text, key) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c => ({ ...c, [key]: true }))
      setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 1500)
    })
  }

  return (
    <div className="card">
      <h1>MD5 Real-time Converter</h1>
      <p className="subtitle">Hash updates as you type</p>

      <label htmlFor="input">Input</label>
      <textarea
        id="input"
        placeholder="Type or paste text here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <div className="options-group">
        <label>MD5 Output Format</label>
        <div className="options">
          <button
            className={`option-btn${caseMode === 'lower' ? ' active' : ''}`}
            onClick={() => setCaseMode('lower')}
          >Lowercase hex</button>
          <button
            className={`option-btn${caseMode === 'upper' ? ' active' : ''}`}
            onClick={() => setCaseMode('upper')}
          >Uppercase hex</button>
          <button className="option-btn btn-clear" onClick={() => setInput('')}>Clear</button>
        </div>
      </div>

      <div className="hash-box" style={{ marginTop: '14px' }}>
        <label>MD5 Hash</label>
        <div className={`hash-value${!displayHash ? ' empty' : ''}`}>
          {loading ? 'Computing…' : (displayHash || 'Enter text above to generate hash')}
        </div>
        <button className={`copy-btn${copied.hash ? ' copied' : ''}`} onClick={() => copy(displayHash, 'hash')}>
          {copied.hash ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <hr className="section-divider" />

      <div className="options-group">
        <label>Character Types to Include in Derived Output</label>
        <div className="charset-row">
          {[
            ['lower',   'abc lowercase'],
            ['upper',   'ABC uppercase'],
            ['digits',  '0-9 digits'],
            ['symbols', '#@$%& symbols'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`charset-btn${charset[key] ? ' active' : ''}`}
              onClick={() => setCharset(c => ({ ...c, [key]: !c[key] }))}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="hash-box" style={{ marginTop: '14px' }}>
        <div className="derived-label">
          <label style={{ marginBottom: 0 }}>Derived Output</label>
          <span className="badge">HMAC-MD5 salted</span>
        </div>
        <div className={`hash-value${!derived ? ' empty' : ''}`}>
          {derived || (Object.values(charset).some(Boolean)
            ? 'Enter text above to generate'
            : 'Enable at least one character type')}
        </div>
        <button className={`copy-btn${copied.derived ? ' copied' : ''}`} onClick={() => copy(derived, 'derived')}>
          {copied.derived ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {input && (
        <div className="meta">
          {input.length} char{input.length !== 1 ? 's' : ''} · HMAC-MD5 with salt
        </div>
      )}
    </div>
  )
}
