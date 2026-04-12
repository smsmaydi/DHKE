import { useState, useMemo, useRef, useEffect } from 'react'
import { computeDHKE, isPrime } from './utils/dhke'

/** Number of steps in the playback sequence (0-indexed: 0, 1, 2, 3). */
const STEPS = 4
/** Delay in ms between automatic step advances when Play is active. */
const PLAY_INTERVAL_MS = 2200
/** localStorage key for light / dark theme (must match index.html boot script). */
const THEME_STORAGE_KEY = 'dhke-theme'

function readStoredTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/**
 * Parses a value as integer and clamps to a minimum; returns fallback if invalid or below min.
 * @param {string|number} value - Input to parse (e.g. from an input field).
 * @param {number} min - Minimum allowed value.
 * @param {number} fallback - Value to return when parsing fails or result < min.
 * @returns {number}
 */
function clampNum(value, min, fallback) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n) || n < min) return fallback
  return n
}

/**
 * Returns a random private key in the range 1–100 as a string (for React controlled inputs).
 * @returns {string}
 */
function getRandomKey() {
  return String(Math.floor(Math.random() * 100) + 1)
}

export default function App() {
  const [g, setG] = useState('3')
  const [p, setP] = useState('17')
  const [a, setA] = useState('15')
  const [b, setB] = useState('13')
  const [hidden, setHidden] = useState(false)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [guess, setGuess] = useState('')
  const [guessFeedback, setGuessFeedback] = useState({ text: '', correct: null })
  const [colorMode, setColorMode] = useState(readStoredTheme)
  const playIntervalRef = useRef(null)

  // Keep <html data-theme> and localStorage in sync with the toggle (professor feedback: dark mode).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, colorMode)
    } catch {
      /* ignore quota / private mode */
    }
  }, [colorMode])

  const params = useMemo(() => ({
    g: Math.max(2, clampNum(g, 2, 3)),
    p: Math.max(2, clampNum(p, 2, 17)),
    a: Math.max(1, clampNum(a, 1, 15)),
    b: Math.max(1, clampNum(b, 1, 13)),
  }), [g, p, a, b])

  const result = useMemo(() => computeDHKE(params.g, params.p, params.a, params.b), [params])
  const pPrime = useMemo(() => isPrime(params.p), [params.p])
  const gPrime = useMemo(() => isPrime(params.g), [params.g])

  useEffect(() => {
    if (!playing) return
    playIntervalRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS - 1) {
          setPlaying(false)
          if (playIntervalRef.current) clearInterval(playIntervalRef.current)
          return STEPS - 1
        }
        return s + 1
      })
    }, PLAY_INTERVAL_MS)
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    }
  }, [playing])

  const goNext = () => {
    setPlaying(false)
    if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    setStep((s) => Math.min(STEPS - 1, s + 1))
  }
  const goPrev = () => {
    setPlaying(false)
    if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    setStep((s) => Math.max(0, s - 1))
  }
  const goFinish = () => {
    setPlaying(false)
    if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    setStep(STEPS - 1)
  }
  const goStart = () => {
    setPlaying(false)
    if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    setStep(0)
  }

  const handleGuess = () => {
    const value = guess.trim()
    if (!value) {
      setGuessFeedback({ text: 'Please enter a number.', correct: false })
      return
    }
    const num = parseInt(value, 10)
    if (Number.isNaN(num)) {
      setGuessFeedback({ text: 'Please enter a valid number.', correct: false })
      return
    }
    if (num === result.shared) {
      setGuessFeedback({ text: 'Correct! You found the shared secret.', correct: true })
    } else {
      setGuessFeedback({ text: 'Wrong. Try again.', correct: false })
    }
  }

  const handleRandomKeys = () => {
    setA(getRandomKey())
    setB(getRandomKey())
  }

  const showPublicKeyCalcs = !hidden && step >= 1
  const showExchange = !hidden && step >= 2
  const showSharedCalcs = !hidden && step >= 3
  const showPublicKeysToEve = hidden || showExchange
  const step1Active = !hidden && step === 1
  const step2Active = !hidden && step === 2
  const step3Active = !hidden && step === 3

  // Short copy so the middle column stays compact (fits one viewport without scrolling).
  const stepDescriptions = [
    'Enter g, p, a, b — then Play or Next.',
    'Public keys: A = g^a mod p, B = g^b mod p.',
    'A and B are exchanged publicly on the network.',
    'Shared secret: B^a mod p = A^b mod p.',
  ]
  const stepNote = !hidden ? stepDescriptions[step] : null

  const toggleVisibility = () => {
    setHidden((h) => {
      if (h) setStep(0)
      return !h
    })
  }

  /*
   * Layout: controls-strip keeps g/p inputs and playback (or random keys) on one horizontal band
   * so typical laptop viewports avoid vertical scrolling (feedback from demo / presentation use).
   */
  return (
    <div className={`app ${hidden ? 'hidden' : ''}`}>
      <div
        className="theme-toggles"
        role="group"
        aria-label="Color theme"
      >
        <button
          type="button"
          className={colorMode === 'light' ? 'active' : ''}
          onClick={() => setColorMode('light')}
          aria-pressed={colorMode === 'light'}
          title="Light background (default)"
        >
          Light
        </button>
        <button
          type="button"
          className={colorMode === 'dark' ? 'active' : ''}
          onClick={() => setColorMode('dark')}
          aria-pressed={colorMode === 'dark'}
          title="Dark background"
        >
          Dark
        </button>
      </div>

      <button
        type="button"
        className={`visibility-toggle ${hidden ? 'hidden' : ''}`}
        onClick={toggleVisibility}
        title={hidden ? 'Show calculations' : 'Hide calculations'}
        aria-label={hidden ? 'Show calculations' : 'Hide calculations'}
      >
        <svg className="icon-eye-open" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <svg className="icon-eye-closed" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <span className="visibility-label">
          {hidden ? 'Show' : 'Hide'}
        </span>
      </button>

      <header className="header">
        <h1>DHKE</h1>
        <p className="subtitle">Diffie–Hellman Key Exchange</p>
      </header>

      {/* Single horizontal strip: public parameters + playback (or random keys) to reduce vertical scroll */}
      <div className="controls-strip">
        <section className="common-params" aria-label="Common parameters">
          <h2 className="common-params-title">
            <span className="public-badge">g, p public</span>
          </h2>
          <div className="params-inline">
            <div className="input-row">
              <label htmlFor="input-g"><code>g</code></label>
              <input
                type="number"
                id="input-g"
                min={2}
                value={g}
                onChange={(e) => setG(e.target.value)}
              />
              <span className={`prime-badge ${gPrime ? 'prime' : 'not-prime'}`}>
                {gPrime ? 'prime' : 'not prime'}
              </span>
            </div>
            <div className="input-row">
              <label htmlFor="input-p"><code>p</code></label>
              <input
                type="number"
                id="input-p"
                min={2}
                value={p}
                onChange={(e) => setP(e.target.value)}
              />
              <span className={`prime-badge ${pPrime ? 'prime' : 'not-prime'}`}>
                {pPrime ? 'prime' : 'not prime'}
              </span>
            </div>
          </div>
        </section>

        {!hidden && (
          <div className="playback-bar" role="toolbar" aria-label="Step playback">
            <button type="button" onClick={goStart} title="First step" aria-label="First step">⏮</button>
            <button type="button" onClick={goPrev} disabled={step === 0} title="Previous step" aria-label="Previous step">◀</button>
            <button
              type="button"
              className="play-pause"
              onClick={() => setPlaying((p) => !p)}
              title={playing ? 'Stop' : 'Play'}
              aria-label={playing ? 'Stop' : 'Play'}
            >
              {playing ? '⏹' : '▶'}
            </button>
            <button type="button" onClick={goNext} disabled={step >= STEPS - 1} title="Next step" aria-label="Next step">▶</button>
            <button type="button" onClick={goFinish} disabled={step >= STEPS - 1} title="Finish" aria-label="Finish">⏭</button>
            <span className="step-indicator" aria-live="polite">Step {step + 1}/{STEPS}</span>
          </div>
        )}

        {hidden && (
          <div className="random-keys-bar">
            <button type="button" className="random-keys-btn" onClick={handleRandomKeys} title="Random private keys for Alice and Bob (1–100)">
              Random a, b (1–100)
            </button>
          </div>
        )}
      </div>

      <main className="exchange-area">
        <div className="side alice-side">
          <h3>Alice</h3>
          <div className="field">
            <label htmlFor="input-a">Alice&apos;s private key (a):</label>
            <input
              type="number"
              id="input-a"
              min={1}
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="private-input"
            />
            <span className="masked-value" aria-hidden="true">**</span>
          </div>
          <div className={`calc-box ${showPublicKeyCalcs ? 'visible' : ''} ${step1Active ? 'step-active' : ''}`}>
            <span className="calc-label">Public key: A = g<sup>a</sup> mod p</span>
            <code>{showPublicKeyCalcs ? `${params.g}^${params.a} mod ${params.p} = ${result.A}` : '—'}</code>
          </div>
          <div className={`arrow-slot exchange-arrow ${showExchange ? 'animating' : ''}`}>
            <span className="arrow-value">{showPublicKeysToEve ? result.B : '?'}</span>
            <span className="arrow-hint">from Bob (public)</span>
          </div>
          <div className={`calc-box ${showSharedCalcs ? 'visible' : ''} ${step3Active ? 'step-active' : ''}`}>
            <span className="calc-label">Shared secret: B<sup>a</sup> mod p</span>
            <code>{showSharedCalcs ? `${result.B}^${params.a} mod ${params.p} = ${result.shared}` : '—'}</code>
          </div>
        </div>

        <div className={`middle ${showExchange ? 'exchange-animate' : ''} ${step2Active ? 'step-active' : ''}`}>
          <div className="arrow-cross">
            <div className="arrow-row">
              <span className="arrow-label">To Bob (A)</span>
              <span className="arrow-value">{showPublicKeysToEve ? result.A : '—'}</span>
            </div>
            <div className="arrow-row">
              <span className="arrow-value">{showPublicKeysToEve ? result.B : '—'}</span>
              <span className="arrow-label">To Alice (B)</span>
            </div>
            {stepNote && <p className="step-description">{stepNote}</p>}
          </div>
        </div>

        <div className="side bob-side">
          <h3>Bob</h3>
          <div className="field">
            <label htmlFor="input-b">Bob&apos;s private key (b):</label>
            <input
              type="number"
              id="input-b"
              min={1}
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="private-input"
            />
            <span className="masked-value" aria-hidden="true">**</span>
          </div>
          <div className={`calc-box ${showPublicKeyCalcs ? 'visible' : ''} ${step1Active ? 'step-active' : ''}`}>
            <span className="calc-label">Public key: B = g<sup>b</sup> mod p</span>
            <code>{showPublicKeyCalcs ? `${params.g}^${params.b} mod ${params.p} = ${result.B}` : '—'}</code>
          </div>
          <div className={`arrow-slot exchange-arrow ${showExchange ? 'animating' : ''}`}>
            <span className="arrow-value">{showPublicKeysToEve ? result.A : '?'}</span>
            <span className="arrow-hint">from Alice (public)</span>
          </div>
          <div className={`calc-box ${showSharedCalcs ? 'visible' : ''} ${step3Active ? 'step-active' : ''}`}>
            <span className="calc-label">Shared secret: A<sup>b</sup> mod p</span>
            <code>{showSharedCalcs ? `${result.A}^${params.b} mod ${params.p} = ${result.shared}` : '—'}</code>
          </div>
        </div>
      </main>

      <section className={`shared-secret-section ${showSharedCalcs ? 'visible' : ''}`}>
        <div className={`shared-secret-box ${step3Active ? 'step-active' : ''}`}>
          <span className="shared-secret-value">{showSharedCalcs ? result.shared : '—'}</span>
          <span className="shared-secret-masked" aria-hidden="true">**</span>
          <span className="shared-secret-label"> shared secret</span>
        </div>
        <div className="visibility-hint hidden-mode-only">
          Private values hidden — guess the shared secret from g, p, A, B.
        </div>
        <div className="visibility-hint visible-mode-only">
          Step with ▶ / ⏭ or use <strong>Hide</strong> for Eve view.
        </div>
      </section>

      {hidden && (
        <section className="guess-section hidden-mode-only" aria-label="Guess the shared secret">
          <div className="guess-row">
            <span className="guess-inline-label">Guess shared secret:</span>
            <input
              type="number"
              id="guess-input"
              min={0}
              placeholder="?"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            />
            <button type="button" onClick={handleGuess}>Check</button>
          </div>
          {guessFeedback.text && (
            <p
              className={`guess-feedback ${guessFeedback.correct ? 'correct' : 'wrong'}`}
              role="status"
            >
              {guessFeedback.text}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
