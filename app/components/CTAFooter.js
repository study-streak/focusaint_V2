'use client'
import Link from 'next/link'
import { useInView } from '../hooks/useInView'

export function CTA() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="section-shell" style={{ textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,64,42,0.05), transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative',
        opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease',
      }}>
        <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 20 }}>Start today</span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.4rem,6vw,4.8rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>
          Stop binge watching.<br /><em style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Start finishing.</em>
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 36 }}>
          Focusaint turns passive videos into real, lasting knowledge — one gated lesson at a time.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Link href="/signup" className="btn-accent" style={{ fontSize: 15, padding: '14px 32px' }}>
            Get started free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <Link href="/login" className="btn-ghost" style={{ fontSize: 15, padding: '14px 32px' }}>Sign in</Link>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(107,104,96,0.6)' }}>
          Free forever plan · No credit card · Cancel anytime
        </p>
      </div>
    </section>
  )
}

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '48px clamp(18px, 3vw, 32px) 36px' }}>
      <div className="container-shell">
        <div className="footer-top-grid" style={{ marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: 3, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L9 5.5H3L6 1Z" fill="white"/><path d="M3 5.5L1.5 11H10.5L9 5.5H3Z" fill="white" opacity=".65"/>
              </svg>
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--white)' }}>Focusaint</span>
          </Link>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Method','Features','Team','Pricing','Blog','Careers'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--muted)'}
              >{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Twitter','LinkedIn','GitHub'].map(s => (
              <a key={s} href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--muted)'}
              >{s}</a>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--line)', marginBottom: 20 }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(107,104,96,0.5)' }}>
            © {year} Focusaint. Built with intention, not distraction.
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(107,104,96,0.5)' }}>
            Incubated at IIT Madras · Nirmaan
          </span>
        </div>
      </div>
    </footer>
  )
}
