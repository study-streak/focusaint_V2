'use client'
import { useInView } from '../../hooks/useInView'
import { useState, useEffect } from 'react'

const cards = [
  {
    front: {
      label: 'Without structure',
      title: 'Endless viewing',
      stat: '12%',
      statLabel: 'avg retention',
      body: 'One video leads to another, but very little stays. It feels productive in the moment, but fades quickly.'
    },
    back: {
      label: 'With guidance',
      title: 'Engaged learning',
      stat: '94%',
      statLabel: 'measured recall',
      body: 'Short prompts and checks help you process each session before moving forward, making the time actually count.'
    },
  },
  {
    front: {
      label: 'Without structure',
      title: 'Constant switching',
      stat: '2h+',
      statLabel: 'per session drift',
      body: 'Recommendations pull you in different directions, making it hard to stay on a single path.'
    },
    back: {
      label: 'With guidance',
      title: 'Steady progression',
      stat: '3×',
      statLabel: 'clearer outcomes',
      body: 'Sessions are paced and connected, so you continue with direction instead of jumping between topics.'
    },
  },
  {
    front: {
      label: 'Without structure',
      title: 'No continuity',
      stat: '0',
      statLabel: 'learning rhythm',
      body: 'Some days are skipped, others are overloaded, but there’s no consistent pattern to build on.'
    },
    back: {
      label: 'With guidance',
      title: 'Regular progress',
      stat: '87%',
      statLabel: 'goal completion',
      body: 'A simple system keeps your learning steady, helping you return and continue without starting over.'
    },
  },
  {
    front: {
      label: 'Without structure',
      title: 'Surface familiarity',
      stat: '73%',
      statLabel: 'overconfidence',
      body: 'Repeated exposure can feel like understanding, even when the concept isn’t fully clear.'
    },
    back: {
      label: 'With guidance',
      title: 'Clear understanding',
      stat: '5×',
      statLabel: 'better outcomes',
      body: 'Explaining ideas in your own words highlights what you truly understand and what needs revisiting.'
    },
  },
]

export default function FlipCards() {
  const [ref, inView] = useInView({ threshold: 0.05 })
  const [isLight, setIsLight] = useState(false)

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
    <section ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div style={{
          marginBottom: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          <div>
            <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>See the difference</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Same time invested.<br /><em style={{ fontStyle: 'italic', color: 'var(--muted)' }}>A different outcome.</em>
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: 'var(--muted)', maxWidth: 280, lineHeight: 1.8 }}>
            Flip each card to see how the approach changes the result.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {cards.map((c, i) => (
            <div key={i} className="flip-card" style={{
              height: 'clamp(260px, 42vw, 300px)',
              opacity: inView ? 1 : 0,
              transform: inView ? 'none' : 'translateY(28px)',
              transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.07}s`,
            }}>
              <div className="flip-inner">
                {/* Front */}
                <div className="flip-front card" style={{ 
                  padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
                }}>
                  <div>
                    <span className="label" style={{ display: 'block', marginBottom: 12 }}>{c.front.label}</span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--white)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                      {c.front.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.75 }}>
                      {c.front.body}
                    </p>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 600, color: isLight ? 'rgba(26,26,26,0.15)' : 'rgba(255,255,255,0.15)', letterSpacing: '-0.02em' }}>
                      {c.front.stat}
                    </div>
                    <span className="label">{c.front.statLabel}</span>
                  </div>
                </div>

                {/* Back */}
                <div className="flip-back" style={{
                  padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  background: 'var(--surface)', border: '1px solid rgba(200,64,42,0.2)', borderRadius: 6,
                  boxShadow: isLight ? '0 4px 16px rgba(200,64,42,0.12)' : 'none',
                }}>
                  <div>
                    <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>{c.back.label}</span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--white)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                      {c.back.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.75 }}>
                      {c.back.body}
                    </p>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                      {c.back.stat}
                    </div>
                    <span className="label" style={{ color: 'var(--accent)' }}>{c.back.statLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
