'use client'
import { useState, useEffect } from 'react'
import { useInView } from '../hooks/useInView'

const faqs = [
  { q: 'How is Focusaint different from just watching YouTube?', a: 'Every lesson is gated behind comprehension checks. You cannot move to the next video until you answer questions, pass a quiz, and write a summary. This forces active recall — the most effective learning technique backed by cognitive science.' },
  { q: 'Why limit the number of daily videos?', a: 'Depth beats breadth. Watching ten tutorials and remembering nothing is worse than finishing one and genuinely understanding it. The daily cap enforces that discipline.' },
  { q: 'What subjects are available?', a: 'Programming (Python, JavaScript, React, DSA), competitive exam prep (UPSC, JEE, CAT), and professional growth. New structured courses launch monthly.' },
  { q: 'Can I use my own content?', a: 'Yes — on Focus and Team plans, paste any YouTube URL and Focusaint auto-generates questions, a quiz, and a summary prompt using our AI engine.' },
  { q: 'What if I fail a quiz?', a: 'Review and retry. There is no penalty — only a gate. Most learners find the second attempt far easier because the first attempt already primed memory through testing.' },
  { q: 'Is there a mobile app?', a: 'iOS and Android apps are available. Progress, streaks, and lessons sync seamlessly across all devices.' },
]

export default function FAQ() {
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
    <section className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div style={{ maxWidth: 720, margin: '0 auto' }} ref={ref}>
        <div style={{
          marginBottom: 48,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>Questions</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em' }}>
            Anything else?
          </h2>
        </div>

        <div style={{
          border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden',
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease 0.1s',
        }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--line)' : 'none' }}>
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
                }}>{f.q}</span>
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
                <p style={{ padding: '0 clamp(16px, 3vw, 24px) clamp(16px, 2.2vw, 20px)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8 }}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: 'center', marginTop: 24,
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)',
          opacity: inView ? 1 : 0, transition: 'all 0.6s ease 0.3s',
        }}>
          More questions? <a href="mailto:hello@focusaint.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@focusaint.com</a>
        </p>
      </div>
    </section>
  )
}
