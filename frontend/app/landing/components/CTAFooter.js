'use client'
import Link from 'next/link'
import { useInView } from '../../hooks/useInView'

export function CTA() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="section-shell" style={{ textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,64,42,0.05), transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative',
        opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease',
      }}>
        <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 24, fontWeight: 600, fontSize: 12 }}>Take control now</span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.6rem,7vw,5rem)', fontWeight: 300, color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 24 }}>
          Stop drifting through videos.<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 300 }}>Start completing what you begin.</em>
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 40 }}>
          Convert scattered video sessions into structured progress with built-in notes, guided flow, and uninterrupted study.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <Link href="/signup" className="btn-accent" style={{ fontSize: 16, padding: '15px 36px', fontWeight: 600 }}>
            Begin your session
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <Link href="/login" className="btn-ghost" style={{ fontSize: 16, padding: '15px 36px', fontWeight: 600 }}>Sign in</Link>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)', opacity: 0.7 }}>
          Free plan available • No upfront commitment • Start instantly
        </p>
      </div>
    </section>
  )
}

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '64px clamp(18px, 3vw, 32px) 44px', background: 'rgba(20,20,20,0.3)' }}>
      <div className="container-shell">
        <div className="footer-top-grid" style={{ marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 4, background: 'linear-gradient(135deg, #d4522f 0%, #c8402a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L9 5.5H3L6 1Z" fill="white"/><path d="M3 5.5L1.5 11H10.5L9 5.5H3Z" fill="white" opacity=".65"/>
              </svg>
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.01em' }}>Focusaint</span>
          </Link>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Method','Features','Team','Pricing','Blog','Careers'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 400, color: 'var(--muted)', textDecoration: 'none', transition: 'all 0.2s', letterSpacing: '0.01em' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--muted)'}
              >{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Twitter','LinkedIn','GitHub'].map(s => (
              <a key={s} href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--muted)', textDecoration: 'none', transition: 'all 0.2s', letterSpacing: '0.02em', textTransform: 'uppercase' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--muted)'}
              >{s}</a>
            ))}
          </div>
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: 28 }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 300, color: 'var(--muted)', opacity: 0.6 }}>
            © {year} Focusaint. Created for learners who value depth over noise.
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 300, color: 'var(--muted)', opacity: 0.6 }}>
            Incubated at IIT Madras · Nirmaan
          </span>
        </div>
      </div>
    </footer>
  )
}
