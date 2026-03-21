'use client'
import { useInView } from '../hooks/useInView'
import Image from 'next/image';


export default function BackedBy() {
  const [ref, inView] = useInView()
 const details = [
            { v: '₹7L+',      l: 'Seed funding'   },
            { v: 'Cohort 45',   l: 'Nirmaan batch'  },
            { v: 'IIT Madras',  l: 'Network and Support partner'},
            { v: '2025',        l: 'Founded'         },
          ]; 
  return (
    <section ref={ref} className="section-shell" style={{ paddingTop: 'clamp(64px, 8vw, 80px)', paddingBottom: 'clamp(64px, 8vw, 80px)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--line)' }}/>

      <div className="container-shell">
        <div className="backedby-grid" style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: 14 }}>Institutional backing</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.2 }}>
              Incubated at IIT Madras<br />through Nirmaan.
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 460 }}>
              Focusaint is a Nirmaan cohort company — India's premier pre-incubation programme at IIT Madras, backing the country's most promising deep-tech founders.
            </p>
          </div>

          {/* Nirmaan badge */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            opacity: inView ? 1 : 0,
            transition: 'all 0.6s ease 0.15s',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(58,138,58,0.15)',
            }}>
              <Image src={'/nirmaan_logo.png'} alt={"nirmaan logo"} width={75} height={75} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--white)', letterSpacing: '0.06em' }}>NIRMAAN</div>
              <span className="label" style={{ display: 'block', marginTop: 4 }}>IITM Pre-Incubator</span>
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 1, marginTop: 40,
          background: 'var(--line)', borderRadius: 6, overflow: 'hidden',
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(16px)',
          transition: 'all 0.6s ease 0.25s',
        }}>
          {details.map((m, i) => (
            <div key={i} style={{ padding: '20px 24px', background: 'var(--card)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--white)', marginBottom: 4, letterSpacing: '-0.01em' }}>{m.v}</div>
              <span className="label">{m.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
