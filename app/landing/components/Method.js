'use client'
import { useInView } from '../../hooks/useInView'

const steps = [
  { n: '01', title: 'Watch',     body: 'A focused, distraction-free lesson. No sidebar. No recommendations. No autoplay. Just the concept you chose to learn.' },
  { n: '02', title: 'Quiz',    body: 'A spaced-repetition quiz surfaces the core ideas. Your brain must retrieve — not recognise. That\'s the difference.' },
  { n: '03', title: 'Practice',      body: 'Learn To Apply the Concepts in the real world.' },
  { n: '04', title: 'Summarise', body: 'Write the lesson in your own words. The Feynman technique, automated. If you can\'t explain it, you don\'t know it.' },
  { n: '05', title: 'Unlock',    body: 'Only then does the next lesson open. Progress is earned, not given. Depth over volume, always.' },
  { n: '06', title: 'Active Recall',    body: 'Spaced repetition of concepts through reflection and summary revisits.' },
]

export default function Method() {
  const [ref, inView] = useInView()

  return (
    <section id="method" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div className="method-grid">
          {/* Left label col */}
          <div className="sticky-col">
            <span className={`label fade-up ${inView ? '' : ''}`} style={{ color: 'var(--accent)', display: 'block', marginBottom: 18,
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(16px)', transition: 'all 0.6s ease', fontWeight: 600, fontSize: 12 }}>
              The method
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem,5vw,3.2rem)',
              fontWeight: 300, color: 'var(--white)', lineHeight: 1.15, letterSpacing: '-0.025em',
              marginBottom: 20,
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.6s ease 0.1s',
            }}>
              Watching is not<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400 }}>learning.</em>
            </h2>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 300,
              color: 'var(--muted)', lineHeight: 1.65, maxWidth: 300,
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.6s ease 0.2s',
            }}>
              Your brain retains information through active retrieval — not passive exposure. Every feature is built around this science.
            </p>
          </div>

          {/* Right steps */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr',
                gap: 28, padding: '32px 0',
                borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateY(24px)',
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.08}s`,
              }}>
                <div>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: 14, 
                    fontWeight: 700,
                    color: i === 1 ? 'var(--accent)' : 'var(--muted)',
                    opacity: i === 1 ? 1 : 0.5,
                    transition: 'all 0.3s'
                  }}>
                    {s.n}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--white)', marginBottom: 10, letterSpacing: '-0.015em' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.7 }}>
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
