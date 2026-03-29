'use client'
import { useState, useEffect } from 'react'
import { useInView } from '../../hooks/useInView'

const realityItems = [
  { q: "How many study videos do you watch every day?", a: "Most students watch 5–10+ daily but retain almost nothing. Volume ≠ learning." },
  { q: "How many concepts can you explain the next day?", a: "Research shows passive watching leads to less than 10% retention after 24 hours." },
  { q: "How many problems can you solve in exams?", a: "Without active recall practice, exam performance stays frustratingly low." }
]

export default function RealityCheck() {
  const [open, setOpen] = useState(null)
  const [isLight, setIsLight] = useState(false)
  const [ref, inView] = useInView()

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement
      setIsLight(html.classList.contains('light') || html.getAttribute('data-theme') === 'light')
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <section id="reality" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          marginBottom: 48,
          opacity: inView ? 1 : 0, 
          transform: inView ? 'none' : 'translateY(20px)', 
          transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>The uncomfortable truth</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em' }}>
            Be Honest With Yourself
          </h2>
        </div>

        <div style={{
          border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden',
          opacity: inView ? 1 : 0, 
          transform: inView ? 'none' : 'translateY(20px)', 
          transition: 'all 0.6s ease 0.1s',
          marginBottom: 36,
        }}>
          {realityItems.map((item, i) => (
            <div key={i} style={{ borderBottom: i < realityItems.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, padding: 'clamp(16px, 2.2vw, 20px) clamp(16px, 3vw, 24px)', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ 
                  fontFamily: 'var(--font-sans)', fontSize: 15, 
                  color: open === i ? 'var(--white)' : (isLight ? 'rgba(26,26,26,0.7)' : 'rgba(245,242,238,0.7)'), 
                  lineHeight: 1.5, transition: 'color 0.2s' 
                }}>{item.q}</span>
                <span style={{
                  width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                  border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: open === i ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.25s, background 0.2s',
                  background: open === i ? 'var(--accent)' : 'transparent',
                }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>
              <div style={{ overflow: 'hidden', maxHeight: open === i ? 200 : 0, transition: 'max-height 0.3s ease' }}>
                <p style={{ padding: '0 clamp(16px, 3vw, 24px) clamp(16px, 2.2vw, 20px)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8 }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
          color: 'var(--white)', lineHeight: 1.65,
          opacity: inView ? 1 : 0, 
          transform: inView ? 'none' : 'translateY(20px)', 
          transition: 'all 0.6s ease 0.2s',
        }}>
          <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Most students consume dozens of tutorials but struggle to apply concepts when it matters.</em>
        </p>
      </div>
    </section>
  )
}
