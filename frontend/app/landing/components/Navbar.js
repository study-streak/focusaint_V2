'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

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

  const links = [
    { label: 'Method', href: '#method' },
    { label: 'Features', href: '#features' },
    { label: 'Products', href: '#products' },
    { label: 'Team', href: '#team' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'background 0.4s, border-color 0.4s',
      background: scrolled ? (isLight ? 'rgba(255,255,255,0.92)' : 'rgba(8,8,8,0.92)') : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? (isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)') : '1px solid transparent',
    }}>
      <div style={{
        maxWidth: 1160, margin: '0 auto',
        padding: '0 clamp(14px, 4vw, 32px)',
        height: 'clamp(52px, 12vw, 64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 10px)' }}>
          <span style={{
            width: 'clamp(18px, 4vw, 24px)',
            height: 'clamp(18px, 4vw, 24px)',
            borderRadius: 4,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="70%" height="70%" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L9 5.5H3L6 1Z" fill="white"/>
              <path d="M3 5.5L1.5 11H10.5L9 5.5H3Z" fill="white" opacity=".65"/>
            </svg>
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.01em' }}>
            Focusaint
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ alignItems: 'center', gap: 'clamp(24px, 3vw, 36px)' }} className="hidden md:flex">
          {links.map(l => (
            <a key={l.label} href={l.href} style={{
              fontFamily: 'var(--font-sans)', fontSize: 'clamp(12px, 1.6vw, 13px)', fontWeight: 400,
              color: 'var(--muted)', textDecoration: 'none',
              letterSpacing: '0.01em', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--white)'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}
            >{l.label}</a>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)' }} className="hidden md:flex">
          <ThemeToggle />
          <Link href="/auth/login" style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(12px, 1.6vw, 13px)', color: 'var(--muted)',
            textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = 'var(--white)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted)'}
          >Sign in</Link>
          <Link href="/auth/signup" className="btn-accent" style={{ padding: 'clamp(7px, 1.4vw, 9px) clamp(16px, 2vw, 20px)', fontSize: 'clamp(12px, 1.6vw, 13px)' }}>
            Get started
          </Link>
        </div>

        {/* Mobile toggle */}
        <div style={{ alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)' }} className="flex md:hidden">
          <ThemeToggle />
          <button onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'clamp(6px, 1.5vw, 8px)', flexDirection: 'column', gap: 'clamp(3px, 1vw, 4px)', display: 'flex' }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                display: 'block', width: 'clamp(18px, 4vw, 24px)', height: 'clamp(1.2px, 0.3vw, 1.5px)', background: 'var(--white)', borderRadius: 1,
                transition: 'all 0.25s',
                transform: open ? (i===0?'rotate(45deg) translate(4px,4px)':i===2?'rotate(-45deg) translate(4px,-4px)':'scaleX(0)') : 'none',
              }}/>
            ))}
          </button>
        </div>
      </div>
            

      {/* Mobile menu */}
      {open && (
        <div style={{ background: isLight ? 'rgba(248,246,244,0.98)' : 'rgba(8,8,8,0.98)', borderTop: '1px solid var(--line)', padding: 'clamp(14px, 3vw, 20px) clamp(14px, 4vw, 32px) clamp(20px, 3vw, 28px)' }}>
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{
              display: 'block', padding: 'clamp(9px, 2vw, 11px) 0', fontSize: 'clamp(14px, 2vw, 15px)', color: 'var(--white)',
              textDecoration: 'none', borderBottom: '1px solid var(--line)',
            }}>{l.label}</a>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(8px, 2vw, 10px)', marginTop: 'clamp(14px, 3vw, 20px)' }}>
            <Link href="/auth/login" className="btn-ghost" style={{ justifyContent: 'center', fontSize: 'clamp(13px, 1.8vw, 14px)', padding: 'clamp(8px, 1.5vw, 10px)' }}>Sign in</Link>
            <Link href="/auth/signup" className="btn-accent" style={{ justifyContent: 'center', fontSize: 'clamp(13px, 1.8vw, 14px)', padding: 'clamp(8px, 1.5vw, 10px)' }}>Get started</Link>
          </div>
        </div>
      )}
    </header>
  )
}
