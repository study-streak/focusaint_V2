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
          textAlign: 'center', marginBottom: 56,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 16, fontWeight: 600 }}>Pricing</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem,5vw,3.2rem)', fontWeight: 300, color: 'var(--white)', letterSpacing: '-0.025em', marginBottom: 20 }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--muted)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Choose the perfect plan for your learning journey
          </p>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: 4, marginTop: 24 }}>
            {['Monthly','Annual'].map((l, i) => (
              <button key={l} onClick={() => setAnnual(i===1)} style={{
                padding: '10px 24px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                background: annual === (i===1) ? 'linear-gradient(135deg, #d4522f 0%, #c8402a 100%)' : 'transparent',
                color: annual === (i===1) ? 'white' : 'var(--muted)',
                transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)', 
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {l}
                {i===1 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 3 }}>SAVE 20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20,
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease 0.1s',
        }}>
          {plans.map((plan, i) => {
            const price = plan.price[annual ? 'a' : 'm']
            return (
              <div key={i} style={{
                borderRadius: 8, padding: '36px 32px',
                background: plan.primary 
                  ? 'linear-gradient(135deg, rgba(200,64,42,0.1) 0%, rgba(200,64,42,0.05) 100%)'
                  : 'rgba(20,20,20,0.5)',
                border: plan.primary 
                  ? '1px solid rgba(200,64,42,0.4)' 
                  : '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column', gap: 0,
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                position: 'relative',
                boxShadow: plan.primary 
                  ? '0 8px 32px rgba(200,64,42,0.15)' 
                  : 'none',
              }}
                onMouseEnter={e => { 
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(200,64,42,0.5)';
                  if (plan.primary) {
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(200,64,42,0.25)';
                  } else {
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = plan.primary ? 'rgba(200,64,42,0.4)' : 'rgba(255,255,255,0.08)';
                  if (plan.primary) {
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(200,64,42,0.15)';
                  } else {
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {plan.primary && <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 2, background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)', 
                  borderRadius: '8px 8px 0 0'
                }}/>}

                <span className="label" style={{ display: 'block', marginBottom: 12, color: 'var(--accent)', fontWeight: 600 }}>{plan.desc}</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 500, color: 'var(--white)', marginBottom: 20, letterSpacing: '-0.015em' }}>{plan.name}</h3>

                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 48, fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.025em' }}>
                    {price === 0 ? 'Free' : `₹${price}`}
                  </span>
                  {price > 0 && <span className="label" style={{ marginLeft: 8, fontSize: 11 }}>/MONTH</span>}
                </div>

                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center', marginBottom: 28,
                  padding: '14px 20px', borderRadius: 6,
                  textDecoration: 'none', fontSize: 15, fontWeight: 600,
                  fontFamily: 'var(--font-sans)', transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  background: plan.primary ? 'linear-gradient(135deg, #d4522f 0%, #c8402a 100%)' : 'rgba(255,255,255,0.06)',
                  color: plan.primary ? 'white' : 'var(--white)',
                  border: plan.primary ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    if (!plan.primary) { 
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--accent)';
                    } else {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,64,42,0.35)';
                    }
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.transform = 'none';
                    if (!plan.primary) { 
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = 'var(--white)';
                    } else {
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >{plan.cta}</Link>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0, minWidth: 16 }}>
                        <path d="M2 8L6 12L14 4" stroke={plan.primary ? 'var(--accent)' : '#4a8a4a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{f}</span>
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
