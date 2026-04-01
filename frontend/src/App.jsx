import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const PRESET_K = [4, 8, 16, 32]
const COMPACT_NUMBER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
})
const FULL_NUMBER = new Intl.NumberFormat('en-US')

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(2)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(2)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

function formatInertiaTick(value) {
  if (!Number.isFinite(value)) return ''
  return COMPACT_NUMBER.format(value)
}

function formatInertiaTooltip(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return ['-', 'Inertia']
  return [FULL_NUMBER.format(Math.round(numericValue)), 'Inertia']
}

export default function App() {
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [kText, setKText] = useState(PRESET_K.join(','))
  const [outputFormat, setOutputFormat] = useState('jpg')
  const [jpegQuality, setJpegQuality] = useState(90)
  const [includeElbow, setIncludeElbow] = useState(true)
  const [elbowMaxK, setElbowMaxK] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [focusK, setFocusK] = useState('')

  const parsedK = useMemo(() => {
    const values = kText
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v) && v > 0)
    return [...new Set(values)]
  }, [kText])

  const onFileChange = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setFilePreview(URL.createObjectURL(selected))
    setResult(null)
    setError('')
  }

  const runAnalysis = async () => {
    if (!file) {
      setError('Please upload an image first.')
      return
    }
    if (parsedK.length === 0) {
      setError('Enter at least one valid k value.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const form = new FormData()
      form.append('image', file)
      form.append('k_values', parsedK.join(','))
      form.append('output_format', outputFormat)
      form.append('jpeg_quality', String(jpegQuality))
      form.append('include_elbow', String(includeElbow))
      form.append('elbow_max_k', String(elbowMaxK))

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: form
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Analysis failed')
      }

      setResult(payload)
      setFocusK(String(payload.results?.[0]?.k ?? ''))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const focusResult = useMemo(() => {
    if (!result || !focusK) return null
    return result.results.find((item) => String(item.k) === String(focusK)) || null
  }, [result, focusK])

  const bestRatio = useMemo(() => {
    if (!result?.results?.length) return null
    return Math.max(...result.results.map((r) => r.compression_ratio))
  }, [result])

  const lowestMse = useMemo(() => {
    if (!result?.results?.length) return null
    return Math.min(...result.results.map((r) => r.mse))
  }, [result])

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <span className="hero-tag">K-Means Compression Studio</span>
          <div className="team-chip" aria-label="Data Drivers Research Team">
            <span className="team-label">TEAM  </span>
            <span className="team-name">DATA  DRIVERS</span>
          </div>
        </div>
        <h1>Image Compression Lab</h1>
        <p>
          Upload an image,
          test multiple values of k, compare quality, and inspect elbow behavior.
        </p>
      </header>

      <section className="controls card">
        <div className="controls-head">
          <h2>Analysis Configuration</h2>
          <p>Set compression options and launch a batch run.</p>
        </div>

        <div className="grid">
          <label>
            Upload image
            <input type="file" accept="image/png,image/jpeg" onChange={onFileChange} />
          </label>

          <label>
            K values (comma separated)
            <input
              value={kText}
              onChange={(e) => setKText(e.target.value)}
              placeholder="4,8,16,32"
            />
          </label>

          <label>
            Output format
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </label>

          <label>
            JPEG quality ({jpegQuality})
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={jpegQuality}
              onChange={(e) => setJpegQuality(Number(e.target.value))}
              disabled={outputFormat !== 'jpg'}
            />
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={includeElbow}
              onChange={(e) => setIncludeElbow(e.target.checked)}
            />
            Run elbow method
          </label>

          <label>
            Elbow max k ({elbowMaxK})
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={elbowMaxK}
              onChange={(e) => setElbowMaxK(Number(e.target.value))}
              disabled={!includeElbow}
            />
          </label>
        </div>

        <button className="run-btn" onClick={runAnalysis} disabled={loading}>
          {loading ? 'Running analysis...' : 'Run Compression'}
        </button>

        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <>
          <section className="metrics">
            <article className="card metric">
              <h3>Original Size</h3>
              <p>{formatBytes(result.original_size_bytes)}</p>
            </article>
            <article className="card metric">
              <h3>Best Ratio</h3>
              <p>{bestRatio !== null ? `${bestRatio.toFixed(2)}x` : '-'}</p>
            </article>
            <article className="card metric">
              <h3>Lowest MSE</h3>
              <p>{lowestMse !== null ? lowestMse.toFixed(2) : '-'}</p>
            </article>
          </section>

          <section className="card results-table">
            <h2>Results Table</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>K</th>
                    <th>MSE</th>
                    <th>Compression Ratio</th>
                    <th>Inertia</th>
                    <th>Compressed Size</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row) => (
                    <tr key={row.k} className={String(row.k) === String(focusK) ? 'is-focus' : ''}>
                      <td>{row.k}</td>
                      <td>{row.mse.toFixed(2)}</td>
                      <td>{row.compression_ratio.toFixed(2)}x</td>
                      <td>{row.inertia.toFixed(2)}</td>
                      <td>{formatBytes(row.compressed_size_bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card preview-panel">
            <h2>Preview</h2>
            <div className="focus-row">
              <label>
                Focus k
                <select value={focusK} onChange={(e) => setFocusK(e.target.value)}>
                  {result.results.map((r) => (
                    <option key={r.k} value={r.k}>
                      {r.k}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="preview-grid">
              <div>
                <h4>Original</h4>
                {filePreview && <img src={filePreview} alt="Original" />}
              </div>
              <div>
                <h4>Compressed</h4>
                {focusResult && (
                  <>
                    <img
                      src={`data:${focusResult.mime};base64,${focusResult.compressed_image_base64}`}
                      alt={`Compressed k=${focusResult.k}`}
                    />
                    <a
                      className="download"
                      href={`data:${focusResult.mime};base64,${focusResult.compressed_image_base64}`}
                      download={`compressed_k${focusResult.k}.${focusResult.mime.includes('png') ? 'png' : 'jpg'}`}
                    >
                      Download k={focusResult.k}
                    </a>
                  </>
                )}
              </div>
            </div>

            <h3>Gallery</h3>
            <div className="gallery">
              {result.results.map((item) => (
                <figure key={item.k}>
                  <img
                    src={`data:${item.mime};base64,${item.compressed_image_base64}`}
                    alt={`k ${item.k}`}
                  />
                  <figcaption>
                    k={item.k} | ratio {item.compression_ratio.toFixed(2)}x
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          {includeElbow && result.elbow?.length > 0 && (
            <section className="card chart-card">
              <h2>Elbow Method</h2>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={result.elbow} margin={{ top: 8, right: 12, left: 26, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5deea" />
                  <XAxis dataKey="k" />
                  <YAxis width={74} tickFormatter={formatInertiaTick} />
                  <Tooltip formatter={formatInertiaTooltip} labelFormatter={(label) => `k=${label}`} />
                  <Line type="monotone" dataKey="inertia" stroke="#2f679b" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}
        </>
      )}
    </div>
  )
}
