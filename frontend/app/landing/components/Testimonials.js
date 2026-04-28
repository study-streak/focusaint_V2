'use client'
import { useState, useEffect, useRef } from 'react'
import { useInView } from '../../hooks/useInView'

const testimonials = [
  {
    quote: "I used to go through multiple React tutorials without much clarity. Working through structured lessons here helped me actually connect the concepts.",
    name: 'Sakura Tanaka',
    role: 'Frontend Engineer',
    co: 'Mercari, Tokyo',
    av: 'ST',
    streak: 28,
    result: 'Faster progress'
  },
  {
    quote: "The checkpoints felt unusual at first, but they made me slow down and understand things properly instead of rushing ahead.",
    name: 'Daniel Osei',
    role: 'Self-taught Developer',
    co: 'Lagos',
    av: 'DO',
    streak: 41,
    result: 'Built stronger basics'
  },
  {
    quote: "I shifted my exam preparation approach and started reviewing concepts more actively. It made a noticeable difference during revision.",
    name: 'Arjun Sharma',
    role: 'UPSC Aspirant',
    co: 'New Delhi',
    av: 'AS',
    streak: 19,
    result: 'Improved confidence'
  },
  {
    quote: "What stands out is the structure. It aligns well with how people gradually build understanding rather than just consuming information.",
    name: 'Dr. Leila Hassan',
    role: 'Learning Scientist',
    co: 'BITS Pilani',
    av: 'LH',
    streak: 62,
    result: 'Recommended to students'
  },
  {
    quote: "I had saved a lot of tutorials but rarely completed them. The guided flow helped me actually finish what I started.",
    name: 'Karan Malhotra',
    role: 'Data Analyst',
    co: 'Mumbai',
    av: 'KM',
    streak: 55,
    result: 'Better consistency'
  },
  {
    quote: "Instead of repeating the same chapters again and again, I began to retain concepts more clearly over time.",
    name: 'Tanvi Joshi',
    role: 'MBA Aspirant',
    co: 'Pune',
    av: 'TJ',
    streak: 22,
    result: 'Stronger retention'
  },
]

const stats = [
  { v: '12,400+', l: 'Users learning daily' },
  { v: '94%',     l: 'Retention level'     },
  { v: '4.9 ★',  l: 'User rating'      },
  { v: '41 days', l: 'Average streak'      },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)
  const [isLight, setIsLight] = useState(false)
  const timerRef = useRef(null)
  const [ref, inView] = useInView({ threshold: 0.05 })

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

  useEffect(() => {
    timerRef.current = setInterval(() => setActive(a => (a + 1) % testimonials.length), 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  const go = i => { setActive(i); clearInterval(timerRef.current) }
  const t = testimonials[active]

  return (
    <section id="stories" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 52,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease',
        }}>
          <div>
            <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>From users</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              From exploring content<br /><em style={{ fontStyle: 'italic', color: 'var(--muted)' }}>to making sense of it.</em>
            </h2>
          </div>
          {/* Arrows */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['←','→'].map((d, i) => (
              <button key={d} onClick={() => go(i === 0 ? (active-1+testimonials.length)%testimonials.length : (active+1)%testimonials.length)}
                style={{ 
                  width: 40, height: 40, borderRadius: 4, border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)', 
                  cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
                  boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.borderColor = isLight ? 'var(--accent)' : 'rgba(255,255,255,0.2)'; 
                  e.currentTarget.style.color = isLight ? 'var(--accent)' : 'var(--white)';
                  e.currentTarget.style.boxShadow = isLight ? '0 4px 12px rgba(200,64,42,0.15)' : 'none';
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.borderColor = 'var(--line)'; 
                  e.currentTarget.style.color = 'var(--muted)';
                  e.currentTarget.style.boxShadow = isLight ? '0 2px 6px rgba(0,0,0,0.06)' : 'none';
                }}
              >{d}</button>
            ))}
          </div>
        </div>

        {/* Featured quote */}
        <div style={{
          borderRadius: 6, border: '1px solid var(--line)', background: 'var(--card)',
          padding: 'clamp(20px, 4vw, 40px)', marginBottom: 16,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease 0.1s',
          boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' : 'none',
          background: isLight ? 'linear-gradient(135deg, #f0ede9 0%, #f5f2ee 100%)' : 'var(--card)',
        }}>
          <div className="testimonial-feature-grid">
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 60, color: 'rgba(200,64,42,0.15)', lineHeight: 0.6, marginBottom: 16, userSelect: 'none' }}>"</div>
              <p style={{
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                fontSize: 'clamp(1.1rem,2.2vw,1.4rem)', color: 'var(--white)',
                lineHeight: 1.6, marginBottom: 28,
              }}>{t.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff', flexShrink: 0 }}>
                  {t.av}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--white)', marginBottom: 2 }}>{t.name}</div>
                  <span className="label">{t.role} · {t.co}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className="label" style={{ padding: '4px 10px', border: '1px solid var(--line)', borderRadius: 3, color: 'var(--gold)' }}>🔥 {t.streak}d streak</span>
                  <span className="label" style={{ padding: '4px 10px', border: '1px solid rgba(74,138,74,0.25)', borderRadius: 3, color: '#4a8a4a' }}>{t.result}</span>
                </div>
              </div>
            </div>
            {/* Index */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 52, fontWeight: 600, color: 'rgba(255,255,255,0.06)', lineHeight: 1 }}>
                {String(active + 1).padStart(2, '0')}
              </span>
              <span className="label">of {String(testimonials.length).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Mini nav */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1,
          background: 'var(--line)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 40,
          opacity: inView ? 1 : 0, transition: 'all 0.6s ease 0.2s',
        }}>
          {testimonials.map((tt, i) => (
            <div key={i} onClick={() => go(i)} style={{
              padding: '14px 16px', background: active === i ? 'var(--surface)' : 'var(--card)',
              borderLeft: active === i ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: active === i ? 'var(--white)' : 'var(--muted)', marginBottom: 3 }}>
                {tt.name.split(' ')[0]}
              </div>
              <span className="label">{tt.result}</span>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1, background: 'var(--line)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)',
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(16px)', transition: 'all 0.6s ease 0.3s',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: '20px 24px', background: 'var(--card)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--white)', marginBottom: 4, letterSpacing: '-0.01em' }}>{s.v}</div>
              <span className="label">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
