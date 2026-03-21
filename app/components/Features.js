'use client'
import { useState } from 'react'
import { useInView } from '../hooks/useInView'

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
          marginBottom: 52,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>Features</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Every feature forces<br /><em style={{ fontStyle: 'italic', color: 'var(--muted)' }}>mastery, not consumption.</em>
          </h2>
        </div>

        <div className="feature-grid" style={{
          background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden',
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)',
          transition: 'all 0.6s ease 0.1s',
        }}>
          {/* Tabs */}
          <div style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
            {features.map((ft, i) => (
              <button key={ft.id} onClick={() => setActive(i)} style={{
                padding: '18px 20px', textAlign: 'left',
                background: active === i ? 'var(--card)' : 'transparent',
                border: 'none', borderLeft: active === i ? '2px solid var(--accent)' : '2px solid transparent',
                borderBottom: i < features.length - 1 ? '1px solid var(--line)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active === i ? 500 : 400,
                color: active === i ? 'var(--white)' : 'var(--muted)',
                letterSpacing: '0.01em',
              }}>
                {ft.label}
              </button>
            ))}
          </div>

          {/* Detail */}
          <div style={{ background: 'var(--card)', padding: 'clamp(22px, 4vw, 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 300 }}>
            <div>
              <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 14 }}>
                {String(active + 1).padStart(2, '0')} — {f.label}
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--white)', marginBottom: 16, letterSpacing: '-0.02em' }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85, maxWidth: 480 }}>
                {f.body}
              </p>
            </div>
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 48, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {f.stat}
                </div>
                <span className="label" style={{ color: 'var(--accent)', marginTop: 6, display: 'block' }}>{f.statLabel}</span>
              </div>
              {/* Tab dots */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {features.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)} style={{
                    width: active === i ? 20 : 6, height: 6, borderRadius: 3,
                    background: active === i ? 'var(--accent)' : 'var(--line)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.3s ease',
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
