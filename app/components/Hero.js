'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const WORDS = ['Watching.', 'Scrolling.', 'Forgetting.']

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const countersRef = useRef(null)
  const didCount = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false)
      setTimeout(() => { setWordIdx(i => (i + 1) % WORDS.length); setFade(true) }, 280)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const el = countersRef.current
    if (!el || didCount.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      didCount.current = true
      el.querySelectorAll('[data-to]').forEach(span => {
        const to = +span.dataset.to
        const dec = span.dataset.dec === '1'
        const suf = span.dataset.suf || ''
        let t = null
        const step = ts => {
          if (!t) t = ts
          const p = Math.min((ts - t) / 1400, 1)
          const v = 1 - Math.pow(1 - p, 3)
          span.textContent = dec ? (v * to).toFixed(1) + suf : Math.floor(v * to).toLocaleString() + suf
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
      obs.disconnect()
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="section-shell" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      paddingBottom: 'clamp(56px, 8vw, 80px)',
      overflow: 'hidden',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 100%)',
      }}/>

      <div className="container-shell hero-grid">

        {/* Left */}
        <div>
          <div className="fade-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'block' }}/>
            <span className="label" style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>Intelligent Learning Platform</span>
          </div>

          <h1 className="fade-up d2" style={{
            fontFamily: 'var(--font-serif)', fontWeight: 300, lineHeight: 1.1,
            fontSize: 'clamp(3.2rem, 6vw, 5.5rem)',
            color: 'var(--white)', marginBottom: 28, letterSpacing: '-0.025em', fontStyle: 'normal'
          }}>
            Stop<br />
            <em style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #d4522f 0%, #c8402a 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontStyle: 'italic',
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.28s ease, transform 0.28s ease',
            }}>{WORDS[wordIdx]}</em><br />
            Start knowing.
          </h1>

          <p className="fade-up d3" style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(15px, 1.9vw, 17px)', fontWeight: 300,
            color: 'var(--muted)', lineHeight: 1.8, maxWidth: 540, marginBottom: 40, letterSpacing: '0.01em'
          }}>
            Millions open YouTube to study. Hours later, almost nothing is remembered. Focusaint replaces passive watching with intelligent active recall.
          </p>

          <div className="fade-up d4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/signup" className="btn-accent">
              Start for free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <a href="#method" className="btn-ghost">See the method</a>
          </div>

          {/* Stats */}
          <div ref={countersRef} className="fade-up d5" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { to: 2000, suf: '+', label: 'Learners' },
              { to: 94,    suf: '%', label: 'Recall rate' },
              { to: 4.9,   suf: '',  label: 'Rating', dec: true },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  data-to={s.to} data-suf={s.suf} data-dec={s.dec ? '1' : '0'}
                  style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.02em' }}
                >0{s.suf}</span>
                <span className="label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — lesson card (desktop) */}
        <div className="fade-up d6 hidden lg:block" style={{ position: 'relative' }}>
          <LessonCard />
        </div>

        {/* Mobile lesson card */}
        <div className="fade-up d6 lg:hidden">
          <MobileLessonCard />
        </div>
      </div>
    </section>
  )
}

function MobileLessonCard() {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden',
      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 10,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => (
            <span key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c, opacity: 0.7 }}/>
          ))}
        </div>
        <span className="label" style={{ fontSize: 8 }}>Lesson 03 of 08</span>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 4px var(--accent)' }}/>
      </div>

      {/* Video area — smaller aspect ratio for mobile */}
      <div style={{
        position: 'relative', aspectRatio: '16/9',
        background: '#090909',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(200,64,42,0.07), transparent 65%)' }}/>

        {/* Play button */}
        <button style={{
          position: 'relative', zIndex: 1,
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(200,64,42,0.3)',
          transition: 'transform 0.2s',
        }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(0.95)'; setTimeout(() => { e.currentTarget.style.transform = 'scale(1)' }, 100) }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </button>

        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{ height: '100%', width: '42%', background: 'var(--accent)', animation: 'progress 1.5s ease 1s both' }}/>
        </div>

        <span style={{ position: 'absolute', bottom: 4, right: 8, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
          5:14 / 12:30
        </span>
      </div>

      {/* Card body — compact for mobile */}
      <div style={{ padding: '12px 14px' }}>
        <p className="label" style={{ marginBottom: 4, fontSize: 8 }}>Algorithm Complexity</p>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'var(--white)', marginBottom: 10, letterSpacing: '-0.01em' }}>
          Big-O Notation
        </h3>

        {/* Quiz gate — simplified */}
        <div style={{
          padding: '8px 10px', background: 'rgba(200,64,42,0.06)',
          border: '1px solid rgba(200,64,42,0.15)', borderRadius: 3, marginBottom: 10,
        }}>
          <p className="label" style={{ color: 'var(--accent)', letterSpacing: '0.14em', fontSize: 7 }}>
            ▸ quiz to unlock next
          </p>
        </div>

        {/* Step indicators — 2 columns on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {[
            { l: 'Watch',    s: 'done'   },
            { l: 'Quiz',     s: 'active' },
            { l: 'Summary',  s: 'idle'   },
            { l: 'Unlock',   s: 'idle'   },
          ].map((step, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding: '4px 6px',
              borderRadius: 2,
              fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.06em',
              background:
                step.s === 'done'   ? 'var(--accent)' :
                step.s === 'active' ? 'rgba(200,64,42,0.14)' :
                'rgba(255,255,255,0.03)',
              color:
                step.s === 'done'   ? '#fff' :
                step.s === 'active' ? 'var(--accent)' :
                'rgba(255,255,255,0.2)',
              border: step.s === 'active' ? '1px solid rgba(200,64,42,0.3)' : '1px solid transparent',
            }}>
              {step.l}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LessonCard() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Shadow card behind */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: -12, bottom: -12,
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8,
      }}/>

      {/* Main card */}
      <div style={{
        position: 'relative', background: 'var(--card)',
        border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Card top bar */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57','#febc2e','#28c840'].map(c => (
              <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }}/>
            ))}
          </div>
          <span className="label">Lesson 03 of 08</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}/>
        </div>

        {/* Video area */}
        <div style={{
          position: 'relative', aspectRatio: '16/9',
          background: '#090909',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* Subtle vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(200,64,42,0.07), transparent 65%)' }}/>

          {/* Waveform decoration */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, display: 'flex', alignItems: 'flex-end', gap: 2, padding: '0 16px 8px', opacity: 0.18 }}>
            {[3,7,11,5,14,9,6,13,8,11,4,15,7,10,12,5,9,6,14,8,11,3,10,7,13].map((h, i) => (
              <div key={i} style={{ flex: 1, height: h, background: 'var(--accent)', borderRadius: 1 }}/>
            ))}
          </div>

          {/* Play btn */}
          <button style={{
            position: 'relative', zIndex: 1,
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--accent)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(200,64,42,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(200,64,42,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(200,64,42,0.35)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </button>

          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.07)' }}>
            <div style={{ height: '100%', width: '42%', background: 'var(--accent)', animation: 'progress 1.5s ease 1s both' }}/>
          </div>

          <span style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            5:14 / 12:30
          </span>
        </div>

        {/* Card body */}
        <div style={{ padding: '18px 20px' }}>
          <p className="label" style={{ marginBottom: 6 }}>Algorithm Complexity</p>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--white)', marginBottom: 16, letterSpacing: '-0.01em' }}>
            Big-O Notation Deep Dive
          </h3>

          {/* Quiz gate */}
          <div style={{
            padding: '10px 14px', background: 'rgba(200,64,42,0.06)',
            border: '1px solid rgba(200,64,42,0.15)', borderRadius: 4, marginBottom: 14,
          }}>
            <p className="label" style={{ color: 'var(--accent)', letterSpacing: '0.16em' }}>
              ▸ complete quiz to unlock next lesson
            </p>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { l: 'Watch',    s: 'done'   },
              { l: 'Quiz',     s: 'active' },
              { l: 'Summarise',s: 'idle'   },
              { l: 'Unlock',   s: 'idle'   },
            ].map((step, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center',
                padding: '5px 2px',
                borderRadius: 3,
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em',
                background:
                  step.s === 'done'   ? 'var(--accent)' :
                  step.s === 'active' ? 'rgba(200,64,42,0.14)' :
                  'rgba(255,255,255,0.03)',
                color:
                  step.s === 'done'   ? '#fff' :
                  step.s === 'active' ? 'var(--accent)' :
                  'rgba(255,255,255,0.2)',
                border: step.s === 'active' ? '1px solid rgba(200,64,42,0.3)' : '1px solid transparent',
              }}>
                {step.l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating streak badge */}
      <div style={{
        position: 'absolute', bottom: -18, left: -24,
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 6,
        padding: '10px 14px',
        animation: 'float 4s ease-in-out infinite',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--gold)', marginBottom: 2 }}>🔥 7-day streak</div>
        <div className="label">Keep it going</div>
      </div>

      {/* Floating quiz badge */}
      <div style={{
        position: 'absolute', top: 40, right: -28,
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 6,
        padding: '10px 14px',
        animation: 'float 5s ease-in-out infinite 1.2s',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div className="label" style={{ color: 'var(--accent)', marginBottom: 3 }}>Quiz unlocked</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--white)' }}>Big-O Notation</div>
      </div>
    </div>
  )
}
