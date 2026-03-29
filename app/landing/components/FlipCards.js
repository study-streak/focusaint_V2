'use client'
import { useInView } from '../../hooks/useInView'
import { useState, useEffect } from 'react'

const cards = [
  {
    front: { label: 'Without Focusaint', title: 'Passive Watching', stat: '12%', statLabel: 'avg retention', body: 'Watch, feel productive, forget everything by morning. The algorithm keeps you comfortable — and ignorant.' },
    back:  { label: 'With Focusaint',    title: 'Active Recall',    stat: '94%', statLabel: 'proven retention', body: 'Answer questions, pass a quiz, write a summary. Uncomfortable by design — but improves focus, clarity and Understanding.' },
  },
  {
    front: { label: 'Without Focusaint', title: 'Infinite Feed',   stat: '2h+', statLabel: 'wasted per session', body: 'Autoplay, Shorts, recommendations — the platform\'s job is to maximise your watch time, not your knowledge.' },
    back:  { label: 'With Focusaint',    title: 'Gated Progress',  stat: '3×',  statLabel: 'faster mastery', body: 'A daily lesson cap. No autoplay. No distractions. Depth is enforced, not left to willpower.' },
  },
  {
    front: { label: 'Without Focusaint', title: 'No Accountability', stat: '0',   statLabel: 'structure', body: 'Miss a day. Watch twenty videos. Skip to lesson 9. Nothing stops you from learning nothing.' },
    back:  { label: 'With Focusaint',    title: 'Daily Streaks',     stat: '87%', statLabel: 'hit their goals', body: 'Streaks that reward depth, not duration. Consistency is built in — not wished for.' },
  },
  {
    front: { label: 'Without Focusaint', title: 'Illusion of Learning', stat: '73%', statLabel: 'confuse familiarity with knowledge', body: 'The more you watch, the more it feels like you know. That feeling is the enemy of actual mastery.' },
    back:  { label: 'With Focusaint',    title: 'Proven Understanding', stat: '5×',  statLabel: 'better exam outcomes', body: 'Write it in your own words. If you cannot explain it simply, you do not know it yet.' },
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
            <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>Hover to compare</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              The same hour.<br /><em style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Very different results.</em>
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: 'var(--muted)', maxWidth: 280, lineHeight: 1.8 }}>
            Each card shows the problem on the front and Focusaint's solution on the back.
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
