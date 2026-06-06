'use client'
import { useInView } from '../../hooks/useInView'
import Link from 'next/link'

export default function Products() {
  const [ref, inView] = useInView({ threshold: 0.05 })

  return (
    <section id="products" ref={ref} className="section-shell" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>
      
      <div className="container-shell">
        <div style={{
          marginBottom: 56,
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 16, fontWeight: 600, fontSize: 12 }}>
            Focus Ecosystem
          </span>
          <h2 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: 'clamp(2.2rem,5vw,3.2rem)', 
            fontWeight: 300, 
            color: 'var(--white)', 
            letterSpacing: '-0.025em', 
            lineHeight: 1.15 
          }}>
            Two interconnected products.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 300 }}>One unified focus strategy.</em>
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 300,
            color: 'var(--muted)',
            lineHeight: 1.65,
            maxWidth: 580,
            marginTop: 18
          }}>
            To truly learn, you need to structure your educational materials and shield yourself from external distractions. Our ecosystem works together to cover both halves.
          </p>
        </div>

        {/* Products Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 28,
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(24px)',
          transition: 'all 0.6s ease 0.1s'
        }}>
          {/* Product 1: Focusaint Web Platform */}
          <div style={{
            background: 'rgba(20,20,20,0.3)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'rgba(20,20,20,0.3)';
          }}>
            {/* Ambient subtle glow background */}
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.015)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }}/>

            <div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 8, 
                background: 'rgba(255, 255, 255, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 28
              }}>
                {/* Screen / Dashboard SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>

              <span className="label" style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.2em' }}>PRODUCT 01 — WEB APPLICATION</span>
              <h3 style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: 28, 
                fontWeight: 400, 
                color: 'var(--white)', 
                marginTop: 10,
                marginBottom: 16
              }}>
                Focusaint Study Platform
              </h3>
              <p style={{ 
                fontFamily: 'var(--font-sans)', 
                fontSize: 14, 
                fontWeight: 300, 
                color: 'var(--muted)', 
                lineHeight: 1.7,
                marginBottom: 28
              }}>
                Your core dashboard for structural learning. Organizes video lectures into bite-sized paced sessions, checks retention with instant quizzes, and facilitates writing reflection summaries.
              </p>

              <div style={{ height: 1, background: 'var(--line)', marginBottom: 24 }}/>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: '0 0 40px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                {[
                  'Bento-style learning HUD',
                  'Gated learning progression checks',
                  'Active recall intervals & streak tracking',
                  'Interactive spaced review system'
                ].map((item, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    fontFamily: 'var(--font-sans)', 
                    fontSize: 13, 
                    color: 'var(--white)',
                    opacity: 0.85
                  }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link href="/auth/signup" className="btn-accent" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                Open Web Platform
              </Link>
            </div>
          </div>

          {/* Product 2: FocusShield Browser Extension */}
          <div style={{
            background: 'rgba(20,20,20,0.3)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(200, 64, 42, 0.3)';
            e.currentTarget.style.background = 'rgba(200, 64, 42, 0.015)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'rgba(20,20,20,0.3)';
          }}>
            {/* Ambient subtle glow background */}
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(200, 64, 42, 0.08)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }}/>

            <div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 8, 
                background: 'rgba(200, 64, 42, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 28
              }}>
                {/* Shield SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <span className="label" style={{ color: 'var(--accent)', fontSize: 10, letterSpacing: '0.2em' }}>PRODUCT 02 — BROWSER COMPANION</span>
              <h3 style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: 28, 
                fontWeight: 400, 
                color: 'var(--white)', 
                marginTop: 10,
                marginBottom: 16
              }}>
                FocusShield Extension
              </h3>
              <p style={{ 
                fontFamily: 'var(--font-sans)', 
                fontSize: 14, 
                fontWeight: 300, 
                color: 'var(--muted)', 
                lineHeight: 1.7,
                marginBottom: 28
              }}>
                A browser filter utility that intercepts and hides recommended feeds, autoplay triggers, chats, and infinite scrolls on platforms where you study (YouTube, Reddit, Twitter, etc.).
              </p>

              <div style={{ height: 1, background: 'var(--line)', marginBottom: 24 }}/>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: '0 0 40px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                {[
                  'Feeds & recommended sidebar blocker',
                  'Shorts, Reels, & infinite scroll loops blocker',
                  'Filters for YouTube, X, Reddit, WhatsApp, Slack',
                  'Developer mode local installation setup'
                ].map((item, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    fontFamily: 'var(--font-sans)', 
                    fontSize: 13, 
                    color: 'var(--white)',
                    opacity: 0.85
                  }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link href="/auth/signup?redirect=/dashboard" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                Setup FocusShield
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
