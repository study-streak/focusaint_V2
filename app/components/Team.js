'use client'
import { useState } from 'react'
import { useInView } from '../hooks/useInView'
import Image from 'next/image'

const team = [
  { name: 'Akash Backalauri',  role: 'Co-founder & CEO', dept: 'IIT Madras · BSC \'26', bio: 'Founder of Focusaint to solve the problem at the root.', av: '/akash.png' },
  { name: 'Kanak Goel',    role: 'Co-founder & CTO', dept: 'SRM-IST · CS \'27',  bio: 'Full-stack engineer. Built Relible and Scalable System and Automation workflows.', av: '/kanak.png' },
  // { name: 'Rajan Nair',    role: 'Learning Design',  dept: 'IIM Bangalore · MBA',   bio: 'Trained 500+ teachers before Focusaint. Brings pedagogical rigour to every product decision.', av: 'RN' },
  // { name: 'Priti Saha',    role: 'Head of Design',   dept: 'NID Ahmedabad',          bio: 'Focused on the right kind of friction. Designed the quiz-gate system from first principles.', av: 'PS' },
]

const getInitials = (fullName) => {
const parts = fullName.trim().split(/\s+/)
const first = parts[0]?.[0] || ''
const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
return (first + last).toUpperCase()
}

export default function Team() {
  const [ref, inView] = useInView({ threshold: 0.05 })
  const [imageErrors, setImageErrors] = useState({})
  return (
    <section id="team" ref={ref} className="section-shell">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div style={{
          marginBottom: 52,
          textAlign: 'center',
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          <span className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>The builders</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            People who refused to<br /><em style={{ fontStyle: 'italic', color: 'var(--muted)' }}>just watch the problem.</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1, background: 'var(--line)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)' }}>
          {team.map((m, i) => (
            <div key={i} style={{
              background: 'var(--card)', padding: 'clamp(20px, 3vw, 28px)',
              textAlign: 'center',
              transition: 'background 0.2s',
              opacity: inView ? 1 : 0,
              transform: inView ? 'none' : 'translateY(24px)',
              transition: `background 0.2s, opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.07}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.07}s`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
            >
              {/* Avatar */}
           <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 18px', background: 'var(--surface)', border: '1px solid var(--line)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--muted)', }} >
             {m.av && !imageErrors[i] ? ( <Image src={m.av} alt={m.name} width={88} height={88} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImageErrors((prev) => ({ ...prev, [i]: true }))} /> ) : ( getInitials(m.name) )} 
            </div> 
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--white)', marginBottom: 4, letterSpacing: '-0.01em' }}>{m.name}</h3>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', marginBottom: 4, fontWeight: 500 }}>{m.role}</div>
              <div className="label" style={{ marginBottom: 14 }}>{m.dept}</div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.75 }}>{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
