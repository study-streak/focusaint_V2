'use client'
import { useInView } from '../../hooks/useInView'

const steps = [
  {
    n: '01',
    title: 'Watch',
    body: 'Start with a clean, distraction-free lesson where your attention stays on a single concept from beginning to end.'
  },
  {
    n: '02',
    title: 'Check',
    body: 'Short questions help you revisit key ideas, ensuring you’re following along instead of just moving forward.'
  },
  {
    n: '03',
    title: 'Apply',
    body: 'Work through simple use-cases to see how the concept fits into real scenarios and builds practical understanding.'
  },
  {
    n: '04',
    title: 'Summarise',
    body: 'Write a brief explanation in your own words to clarify what you’ve understood and identify any gaps.'
  },
  {
    n: '05',
    title: 'Continue',
    body: 'Once you’re clear, the next lesson opens, keeping your progress steady and well-paced.'
  },
  {
    n: '06',
    title: 'Revisit',
    body: 'Key ideas are revisited over time so they stay familiar and easier to recall when needed.'
  },
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
              Learning flow
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem,5vw,3.2rem)',
              fontWeight: 300, color: 'var(--white)', lineHeight: 1.15, letterSpacing: '-0.025em',
              marginBottom: 20,
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.6s ease 0.1s',
            }}>
              Learning needs<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400 }}>active involvement.</em>
            </h2>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 300,
              color: 'var(--muted)', lineHeight: 1.65, maxWidth: 300,
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.6s ease 0.2s',
            }}>
              Understanding improves when you engage with what you study. Each step here is designed to help you process, apply, and retain information more effectively.
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
