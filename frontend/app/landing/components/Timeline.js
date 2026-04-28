'use client'
import { useInView } from '../../hooks/useInView'
import { useEffect, useState } from 'react'

const items = [
  { date: 'Oct 2025', title: 'The idea',           body: 'Aryan fails a DSA interview after 80+ hours of YouTube. Realises passive watching is the core problem.', status: 'done'   },
  { date: 'Dec 2025', title: 'Nirmaan cohort',      body: 'Selected for Nirmaan Cohort 45 at IIT Madras. Seed capital, mentors, and lab access.', status: 'done', highlight: true },
  { date: 'Jan 2026', title: 'First prototype',     body: 'A Chrome extension that blocks autoplay and adds a quiz after each video. 60 beta users, 91% retention improvement.', status: 'done'   },
  { date: 'April 2026', title: 'Platform launch',     body: 'Full web platform with gated lessons, spaced-repetition quizzes, and summary writing. 1,200 users in Week 1.', status: 'active'   },
  { date: 'June 2026', title: '10,000 learners',     body: 'Crossed 10K active learners. 94% recall rate validated by IIT Madras Learning Sciences Lab.', status: 'future'   },
  { date: 'Aug 2026', title: 'AI quiz engine',       body: 'Paste any YouTube URL. Focusaint auto-generates questions, quizzes, and summary prompts.', status: 'future' },
  { date: 'Nov 2026', title: 'Institutions',         body: 'B2B plan for coaching centres, colleges, and corporate L&D teams.', status: 'future' },
  { date: 'Jan 2027',    title: 'Pan-India scale',      body: 'Regional language support. Partnerships with NPTEL and CBSE.', status: 'future' },
]

export default function Timeline() {
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

  const dot = isLight 
    ? { done: '#2d5a2d', active: 'var(--accent)', future: '#8f8a82' }
    : { done: '#4a8a4a', active: 'var(--accent)', future: 'rgba(255,255,255,0.12)' }
  
  const line = isLight
    ? { done: 'rgba(45,90,45,0.3)', active: 'rgba(200,64,42,0.3)', future: 'rgba(0,0,0,0.14)' }
    : { done: 'rgba(74,138,74,0.25)', active: 'rgba(200,64,42,0.25)', future: 'rgba(255,255,255,0.06)' }
  
  const legendColor = isLight ? '#c0c0b8' : 'rgba(255,255,255,0.15)'

  return (
    <section id="timeline" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div className="timeline-grid">
          {/* Left */}
          <div className="sticky-col" style={{
            opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
            transition: 'all 0.6s ease',
          }}>
            <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>Roadmap</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
              From one failed<br />interview to<br /><em style={{ fontStyle: 'italic', color: 'var(--muted)' }}>12,400 learners.</em>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              {[{ c: isLight ? '#2d5a2d' : '#4a8a4a', l: 'Completed' }, { c: 'var(--accent)', l: 'In progress' }, { c: legendColor, l: 'Upcoming' }].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.c, display: 'block' }}/>
                  <span className="label">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right timeline */}
          <div style={{ position: 'relative', paddingLeft: 'clamp(18px, 2.4vw, 28px)' }}>
            {/* Spine */}
            <div style={{ 
              position: 'absolute', left: 8, top: 8, bottom: 8, width: 1, 
              background: isLight 
                ? 'linear-gradient(180deg, #2d5a2d 0%, var(--accent) 62%, rgba(0,0,0,0.1) 100%)'
                : 'linear-gradient(180deg, #4a8a4a 0%, var(--accent) 62%, rgba(255,255,255,0.06) 100%)'
            }}/>

            {items.map((item, i) => (
              <div key={i} style={{
                position: 'relative', paddingBottom: i < items.length - 1 ? 32 : 0,
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateX(-16px)',
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.06}s`,
              }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: -24, top: 3,
                  width: 14, height: 14, borderRadius: '50%',
                  background: item.status === 'done'
                    ? (isLight ? '#2d5a2d' : '#4a8a4a')
                    : item.status === 'active'
                      ? 'var(--accent)'
                      : (isLight ? 'rgba(0,0,0,0.04)' : 'var(--surface)'),
                  border: `1px solid ${dot[item.status]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: item.status === 'active' ? '0 0 10px rgba(200,64,42,0.4)' : 'none',
                }}>
                  {item.status === 'done' && (
                    <svg width="6" height="6" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke={isLight ? '#1a1a1a' : 'white'} strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  )}
                  {item.status === 'future' && (
                    <svg width="6" height="6" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2L8 8M8 2L2 8" stroke={isLight ? '#6b6860' : 'rgba(245,242,238,0.55)'} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span className="label" style={{ minWidth: 64, paddingTop: 2 }}>{item.date}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600,
                        letterSpacing: '-0.01em',
                        color: item.status === 'future' ? (isLight ? 'rgba(26,26,26,0.7)' : 'rgba(245,242,238,0.35)') : 'var(--white)',
                      }}>{item.title}</h3>
                      {item.highlight && (
                        <span className="label" style={{ color: isLight ? '#2d5a2d' : '#4a8a4a', padding: '2px 8px', border: `1px solid ${isLight ? 'rgba(45,90,45,0.4)' : 'rgba(74,138,74,0.3)'}`, borderRadius: 3 }}>
                          IITM Nirmaan
                        </span>
                      )}
                      {item.status === 'active' && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'blink 1.4s infinite', display: 'inline-block' }}/>
                      )}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, lineHeight: 1.75,
                      color: item.status === 'future' ? (isLight ? 'rgba(90,85,80,0.8)' : 'rgba(107,104,96,0.5)') : 'var(--muted)',
                    }}>{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
