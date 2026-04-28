'use client'
import { useInView } from '../../hooks/useInView'
import { useEffect, useState } from 'react'

const traps = [
  {
    icon: '∞',
    title: 'Continuous Playback',
    body: 'The next video starts instantly, leaving little time to pause and process what you just saw.'
  },
  {
    icon: '↕',
    title: 'Endless Suggestions',
    body: 'New recommendations keep appearing, making it easy to switch topics before finishing one properly.'
  },
  {
    icon: '✗',
    title: 'No Clear Path',
    body: 'You can jump between topics freely, but without structure it becomes hard to track what you’ve actually understood.'
  },
  {
    icon: '◎',
    title: 'Surface Signals',
    body: 'Time spent and videos watched look productive, but they don’t reflect how much you’ve really grasped.'
  },
]

export default function PlatformTrap() {
  const [ref, inView] = useInView()
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
    <section id="problem" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
        }}>
          <div style={{
            marginBottom: 48,
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(20px)',
            transition: 'all 0.6s ease',
          }}>
            <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 12 }}>
              What happens today
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.2rem,5vw,3.2rem)',
              fontWeight: 300,
              color: 'var(--white)',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
            }}>
              More time spent doesn’t always mean{' '}
              <em style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400 }}>more learned</em>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'clamp(20px, 3vw, 32px)',
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.1s',
          }}>
            {traps.map((trap, i) => (
              <div key={i} style={{
                padding: 'clamp(28px, 4vw, 40px)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                background: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                transition: 'border-color 0.3s, background 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--line)'
                  e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div style={{
                  fontSize: 48,
                  marginBottom: 20,
                  lineHeight: 1,
                  color: 'var(--accent)',
                  fontWeight: 300,
                }}>
                  {trap.icon}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  fontWeight: 600,
                  color: 'var(--white)',
                  marginBottom: 12,
                  lineHeight: 1.3,
                  letterSpacing: '-0.3px',
                }}>
                  {trap.title}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(13px, 1.2vw, 15px)',
                  fontWeight: 300,
                  color: isLight ? 'rgba(26,26,26,0.7)' : 'rgba(245, 242, 238, 0.65)',
                  lineHeight: 1.6,
                }}>
                  {trap.body}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            marginTop: 48,
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 300,
            color: 'var(--muted)',
            lineHeight: 1.65,
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.2s',
          }}>
            You started with the intent to learn. <strong style={{ color: 'var(--white)', fontWeight: 500 }}>But without structure, it’s easy to lose direction.</strong>
          </p>
        </div>
      </div>
    </section>
  )
}
