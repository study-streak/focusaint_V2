'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useInView } from '../hooks/useInView'

const plans = [
  {
    name: 'Free', price: { m: 0, a: 0 }, desc: 'Start here. No card needed.',
    features: ['3 gated lessons per day','Basic comprehension quizzes','Streak tracker','5 active courses'],
    cta: 'Start free', href: '/signup', primary: false,
  },
  {
    name: 'Focus', price: { m: 499, a: 399 }, desc: 'For serious learners.',
    features: ['Unlimited gated lessons','Spaced-repetition engine','AI-generated quizzes','Summary feedback','Progress analytics','Priority support'],
    cta: '7-day free trial', href: '/signup', primary: true,
  },
  {
    name: 'Team', price: { m: 1999, a: 1599 }, desc: 'For groups & institutions.',
    features: ['Everything in Focus','Up to 20 members','Admin dashboard','Group analytics','Custom course builder','Dedicated support'],
    cta: 'Contact us', href: '#', primary: false,
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
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
    <section id="pricing" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div style={{
          textAlign: 'center', marginBottom: 48,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>Pricing</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 24 }}>
            Simple, honest pricing.
          </h2>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 4, padding: 3 }}>
            {['Monthly','Annual'].map((l, i) => (
              <button key={l} onClick={() => setAnnual(i===1)} style={{
                padding: '8px 20px', borderRadius: 3, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13,
                background: annual === (i===1) ? 'var(--card)' : 'transparent',
                color: annual === (i===1) ? 'var(--white)' : 'var(--muted)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {l}
                {i===1 && <span className="label" style={{ color: isLight ? '#2d5a2d' : '#4a8a4a', padding: '2px 6px', border: `1px solid ${isLight ? 'rgba(45,90,45,0.4)' : 'rgba(74,138,74,0.3)'}`, borderRadius: 3 }}>–20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease 0.1s',
        }}>
          {plans.map((plan, i) => {
            const price = plan.price[annual ? 'a' : 'm']
            return (
              <div key={i} style={{
                borderRadius: 6, padding: '32px 28px',
                background: plan.primary ? 'var(--surface)' : 'var(--card)',
                border: plan.primary ? '1px solid rgba(200,64,42,0.35)' : '1px solid var(--line)',
                display: 'flex', flexDirection: 'column', gap: 0,
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: isLight 
                  ? (plan.primary ? '0 8px 24px rgba(200,64,42,0.12)' : '0 4px 12px rgba(0,0,0,0.08)')
                  : 'none',
              }}
                onMouseEnter={e => { 
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  if (isLight) {
                    e.currentTarget.style.boxShadow = plan.primary 
                      ? '0 12px 32px rgba(200,64,42,0.18)' 
                      : '0 8px 20px rgba(0,0,0,0.12)';
                  }
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.transform = 'none';
                  if (isLight) {
                    e.currentTarget.style.boxShadow = plan.primary 
                      ? '0 8px 24px rgba(200,64,42,0.12)' 
                      : '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
              >
                {plan.primary && <div style={{ height: 2, background: 'var(--accent)', marginBottom: 28, marginTop: -32, marginLeft: -28, marginRight: -28, borderRadius: '6px 6px 0 0' }}/>}

                <span className="label" style={{ display: 'block', marginBottom: 8 }}>{plan.desc}</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--white)', marginBottom: 16, letterSpacing: '-0.01em' }}>{plan.name}</h3>

                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.03em' }}>
                    {price === 0 ? 'Free' : `₹${price}`}
                  </span>
                  {price > 0 && <span className="label" style={{ marginLeft: 6 }}>/month</span>}
                </div>

                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center', marginBottom: 24,
                  padding: '12px', borderRadius: 4,
                  textDecoration: 'none', fontSize: 14, fontWeight: 500,
                  fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                  background: plan.primary ? 'var(--accent)' : 'transparent',
                  color: plan.primary ? 'white' : 'var(--muted)',
                  border: plan.primary ? 'none' : '1px solid var(--line)',
                }}
                  onMouseEnter={e => { 
                    if (!plan.primary) { 
                      e.currentTarget.style.borderColor = 'var(--accent)'; 
                      e.currentTarget.style.color = 'var(--accent)' 
                    } else { 
                      e.currentTarget.style.background = 'var(--accent2)' 
                    } 
                  }}
                  onMouseLeave={e => { 
                    if (!plan.primary) { 
                      e.currentTarget.style.borderColor = 'var(--line)'; 
                      e.currentTarget.style.color = 'var(--muted)' 
                    } else { 
                      e.currentTarget.style.background = 'var(--accent)' 
                    } 
                  }}
                >{plan.cta}</Link>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                        <path d="M1.5 6L4.5 9L10.5 3" stroke={plan.primary ? 'var(--accent)' : '#4a8a4a'} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--muted)', opacity: 0.6 }}>
          No credit card required for free plan · 7-day money-back guarantee · Cancel anytime
        </p>
      </div>
    </section>
  )
}
