'use client'
import { useState } from 'react'
import { useInView } from '../../hooks/useInView'

const features = [
  { id: 'limit',  label: 'Video limit',      title: 'Less videos. Deeper learning.', body: 'YouTube incentivises unlimited watching — more time means more ad revenue. Focusaint caps your daily lessons so you go deep, not wide. Depth is where mastery lives.', stat: '3×', statLabel: 'deeper retention vs re-watching' },
  { id: 'gate',   label: 'Gated progress',   title: 'Earn the next lesson.',         body: 'Progress is locked until you prove comprehension. Answer questions, pass a quiz, write a summary. There is no shortcut. This single constraint is the most powerful learning intervention we\'ve built.', stat: '94%', statLabel: 'average recall rate' },
  { id: 'quiz',   label: 'Spaced repetition',title: 'Your brain needs to struggle.',  body: 'Spaced-repetition quizzes built into every lesson. The science is clear: retrieval practice — the act of recalling information — is five times more effective than re-reading or re-watching.', stat: '5×', statLabel: 'more effective than passive review' },
  { id: 'write',  label: 'Summary writing',  title: 'Teach it to own it.',           body: 'After each lesson you write a summary in your own words. The Feynman technique is the gold standard of comprehension testing — and we\'ve made it unavoidable. If you cannot explain it simply, you do not know it.', stat: '87%', statLabel: 'improvement in assessments' },
  { id: 'streak', label: 'Streak system',    title: 'Consistency over intensity.',   body: 'Seven focused minutes of gated learning outperforms two hours of passive watching, every day. Our streak system rewards depth and regularity — the only two habits that actually compound.', stat: '41d', statLabel: 'average learner streak' },
]

export default function Features() {
  const [active, setActive] = useState(0)
  const [ref, inView] = useInView({ threshold: 0.05 })
  const f = features[active]

  return (
    <section id="features" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div style={{
          marginBottom: 56,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 16, fontWeight: 600, fontSize: 12 }}>Features</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem,5vw,3.2rem)', fontWeight: 300, color: 'var(--white)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            Every feature forces<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 300 }}>mastery over consumption.</em>
          </h2>
        </div>

        <div className="feature-grid" style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden',
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)',
          transition: 'all 0.6s ease 0.1s',
        }}>
          {/* Tabs */}
          <div style={{ background: 'rgba(20,20,20,0.4)', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            {features.map((ft, i) => (
              <button key={ft.id} onClick={() => setActive(i)} style={{
                padding: '20px 24px', textAlign: 'left',
                background: active === i ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: 'none', borderLeft: active === i ? '3px solid var(--accent)' : '3px solid transparent',
                borderBottom: i < features.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active === i ? 600 : 400,
                color: active === i ? 'var(--white)' : 'var(--muted)',
                letterSpacing: '0.01em',
              }}>
                {ft.label}
              </button>
            ))}
          </div>

          {/* Detail */}
          <div style={{ background: 'rgba(20,20,20,0.2)', padding: 'clamp(28px, 4vw, 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 340 }}>
            <div>
              <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 16, fontWeight: 600, fontSize: 11 }}>
                {String(active + 1).padStart(2, '0')} — {f.label.toUpperCase()}
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--white)', marginBottom: 18, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 520 }}>
                {f.body}
              </p>
            </div>
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 56, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {f.stat}
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)', marginTop: 8, maxWidth: 140, lineHeight: 1.5 }}>{f.statLabel}</p>
              </div>
              {/* Tab dots */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {features.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)} style={{
                    width: active === i ? 24 : 8, height: 8, borderRadius: 4,
                    background: active === i ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
