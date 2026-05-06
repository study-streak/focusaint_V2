'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../landing/components/ThemeToggle'
import { persistAuthToken } from '../../../lib/auth-cookie'
import { APIClient } from '../../../lib/api-client'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode,     setMode]     = useState('password') // 'password' | 'magic'
  const [form,     setForm]     = useState({ email: '', password: '' })
  const [errors,   setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  
  const [step, setStep] = useState('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const [resending, setResending] = useState(false)

  // Auto-populate email from URL if present
  useState(() => {
    const emailParam = searchParams.get('email')
    if (emailParam && !form.email) {
      setForm(f => ({ ...f, email: emailParam }))
    }
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const nextPath = searchParams.get("next")
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard"

  // Validation
  const validate = () => {
    const e = {}
    if (!form.email.includes('@'))                      e.email    = 'Invalid email'
    if (mode === 'password' && !form.password.length)   e.password = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  // Handlers
  const handleLogin = async (ev) => {
    if (ev) ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'magic') {
        setSent(true)
        setLoading(false)
        return
      }

      const data = await APIClient.post('/api/auth/login', { email: form.email, password: form.password })

      persistAuthToken(data.token)
      router.push(safeNextPath)
    } catch (err) {
      if (err.name === 'APIError' && err.status === 403 && err.data?.requiresVerification) {
        setStep("otp")
        setErrors({})
        return
      }
      setErrors({ global: err instanceof Error ? err.message : "Failed to login" })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (ev) => {
    if (ev) ev.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await APIClient.post('/api/auth/forgot-password', { email: forgotEmail })
      setForgotSent(true)
    } catch (err) {
      setErrors({ global: err instanceof Error ? err.message : "Failed to send reset link" })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (ev) => {
    if (ev) ev.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      if (resetPassword !== resetConfirm) throw new Error("Passwords do not match")
      await APIClient.post('/api/auth/reset-password', { email: forgotEmail, token: resetToken, newPassword: resetPassword })
      
      setStep("login")
      setErrors({})
      setForgotSent(false)
      setResetToken("")
      setResetPassword("")
      setResetConfirm("")
      setForgotEmail("")
      alert("Password reset successful! Please login.")
    } catch (err) {
      setErrors({ global: err instanceof Error ? err.message : "Failed to reset password" })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (ev) => {
    if (ev) ev.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const data = await APIClient.post('/api/auth/verify-otp', { email: form.email, otp })
      persistAuthToken(data.token)
      router.push(safeNextPath)
    } catch (err) {
      setErrors({ global: err instanceof Error ? err.message : "Failed to verify OTP" })
    } finally {
      setLoading(false)
    }
  }
  const handleResendOTP = async () => {
    setResending(true)
    setErrors({})
    try {
      await APIClient.post('/api/auth/resend-otp', { email: form.email })
      setOtp("")
    } catch (err) {
      setErrors({ global: err instanceof Error ? err.message : "Failed to resend OTP" })
    } finally {
      setResending(false)
    }
  }

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true)
    setErrors({})
    try {
      const data = await APIClient.post('/api/auth/google', { 
        accessToken: tokenResponse.access_token 
      })
      persistAuthToken(data.token)
      router.push(safeNextPath)
    } catch (err) {
      setErrors({ global: err instanceof Error ? err.message : "Google login failed" })
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setErrors({ global: "Google Login failed" })
  })

  return (
    <div className="auth-shell" style={{ position: 'relative' }}>

      <div style={{
        position: 'absolute', top: 18, left: 18, right: 18, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L9 5.5H3L6 1Z" fill="white"/><path d="M3 5.5L1.5 11H10.5L9 5.5H3Z" fill="white" opacity=".65"/>
            </svg>
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--white)' }}>Focusaint</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Left brand panel */}
      <div style={{
        flex: '0 0 420px', padding: '48px', borderRight: '1px solid var(--line)',
        flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
      }} className="hidden lg:flex">
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 100% 100% at 0% 100%, black 20%, transparent 80%)',
        }}/>

        {/* Large stat */}
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 72, fontWeight: 400, color: 'var(--line)', lineHeight: 1, marginBottom: 8 }}>94%</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: 'var(--white)', lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: 12 }}>
            Proven recall rate.<br />Not just satisfied learners.
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8 }}>
            Validated by IIT Madras Learning Sciences Lab across 12,400 active learners.
          </p>
        </div>

        {/* Bottom stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
          {[{ v: '12,400+', l: 'Learners' }, { v: '41 days', l: 'Avg streak' }].map((s, i) => (
            <div key={i} style={{ padding: '16px', background: 'var(--card)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--white)', marginBottom: 3, letterSpacing: '-0.01em' }}>{s.v}</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap" style={{ maxWidth: 380 }}>

          {step === 'login' && sent ? (
            <MagicSent email={form.email} />
          ) : step === 'login' ? (
            <div className="fade-in">
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  Welcome back.
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)' }}>
                  Continue your learning streak.
                </p>
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 4, padding: 3, marginBottom: 24 }}>
                {[{ id: 'password', label: 'Password' }, { id: 'magic', label: '✦ Magic link' }].map(m => (
                  <button key={m.id} onClick={() => { setMode(m.id); setErrors({}) }} style={{
                    flex: 1, padding: '9px 12px', borderRadius: 3, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 12, transition: 'all 0.2s',
                    background: mode === m.id ? 'var(--card)' : 'transparent',
                    color: mode === m.id ? 'var(--white)' : 'var(--muted)',
                  }}>{m.label}</button>
                ))}
              </div>

              {/* Form starts here */}
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: errors.email ? 'var(--accent)' : 'var(--muted)', marginBottom: 7 }}>
                    {errors.email || 'Email'}
                  </label>
                  <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>

                {/* Password (conditional) */}
                {mode === 'password' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: errors.password ? 'var(--accent)' : 'var(--muted)' }}>
                        {errors.password || 'Password'}
                      </label>
                      <a href="#" onClick={(e) => { e.preventDefault(); setStep('forgot'); setForgotEmail(form.email); setErrors({}); setForgotSent(false); }} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)', textDecoration: 'none' }}>FORGOT?</a>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input className="input" type={showPass ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight: 56 }} />
                      <button type="button" onClick={() => setShowPass(v => !v)} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em',
                      }}>{showPass ? 'HIDE' : 'SHOW'}</button>
                    </div>
                  </div>
                )}

                {mode === 'magic' && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.7 }}>
                    We'll email you a one-click sign-in link. No password needed.
                  </p>
                )}

                {errors.global && <p style={{ color: 'var(--accent)', fontSize: 13, margin: '0' }}>{errors.global}</p>}

                <button type="submit" disabled={loading} className="btn-accent" style={{ width: '100%', justifyContent: 'center', fontSize: 14, opacity: loading ? 0.7 : 1, marginTop: 4 }}>
                  {loading ? (
                    <><Spinner />{mode === 'magic' ? 'Sending…' : 'Signing in…'}</>
                  ) : mode === 'magic' ? 'Send magic link ✦' : 'Sign in →'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>

              <div className="auth-oauth-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => loginWithGoogle()} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '11px', borderRadius: 4, border: '1px solid var(--line)',
                  background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13, transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'var(--white)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)' }}
                ><GoogleIcon />Google</button>

                <button style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '11px', borderRadius: 4, border: '1px solid var(--line)',
                  background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13, transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'var(--white)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)' }}
                ><GitHubIcon />GitHub</button>
              </div>

              <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)' }}>
                No account yet?{' '}
                <Link href="/auth/signup" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Create one free</Link>
              </p>
            </div>
          ) : step === 'forgot' ? (
            <div className="fade-in">
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  Forgot Password.
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)' }}>
                  Enter your email to receive a password reset code.
                </p>
              </div>
              <form onSubmit={forgotSent ? (e) => { e.preventDefault(); setStep('reset'); } : handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
                    Email
                  </label>
                  <input className="input" type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} disabled={forgotSent} />
                </div>
                {errors.global && <p style={{ color: 'var(--accent)', fontSize: 13, margin: '0' }}>{errors.global}</p>}
                
                {forgotSent ? (
                  <>
                    <p style={{ color: 'var(--green, #34A853)', fontSize: 13, margin: '0' }}>Reset code sent! Check your email.</p>
                    <button type="submit" className="btn-accent" style={{ width: '100%', justifyContent: 'center', fontSize: 14, marginTop: 4 }}>
                      Enter Reset Code →
                    </button>
                  </>
                ) : (
                  <button type="submit" disabled={loading || !forgotEmail} className="btn-accent" style={{ width: '100%', justifyContent: 'center', fontSize: 14, opacity: loading || !forgotEmail ? 0.7 : 1, marginTop: 4 }}>
                    {loading ? <><Spinner />Sending…</> : 'Send Reset Code →'}
                  </button>
                )}
                
                <button type="button" onClick={() => { setStep('login'); setErrors({}); }} style={{ background: 'none', border: '1px solid var(--line)', padding: '12px', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', marginTop: '8px', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                  Back to Login
                </button>
              </form>
            </div>
          ) : step === 'reset' ? (
            <div className="fade-in">
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  Reset Password.
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)' }}>
                  Enter the code sent to your email and your new password.
                </p>
              </div>
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
                    Reset Code
                  </label>
                  <input className="input" type="text" placeholder="Code from email" value={resetToken} onChange={e => setResetToken(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
                    New Password
                  </label>
                  <input className="input" type="password" placeholder="New password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
                    Confirm Password
                  </label>
                  <input className="input" type="password" placeholder="Confirm new password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} />
                </div>
                {errors.global && <p style={{ color: 'var(--accent)', fontSize: 13, margin: '0' }}>{errors.global}</p>}
                
                <button type="submit" disabled={loading || !resetToken || !resetPassword || !resetConfirm} className="btn-accent" style={{ width: '100%', justifyContent: 'center', fontSize: 14, opacity: loading || !resetToken || !resetPassword || !resetConfirm ? 0.7 : 1, marginTop: 4 }}>
                  {loading ? <><Spinner />Resetting…</> : 'Reset Password →'}
                </button>
                <button type="button" onClick={() => { setStep('login'); setErrors({}); }} style={{ background: 'none', border: '1px solid var(--line)', padding: '12px', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', marginTop: '8px', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                  Back to Login
                </button>
              </form>
            </div>
          ) : step === 'otp' ? (
            <div className="fade-in">
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  Verify Email.
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)' }}>
                  We've sent a 6-digit code to <span style={{ color: 'var(--white)' }}>{form.email}</span>
                </p>
              </div>
              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
                    Enter OTP Code
                  </label>
                  <input className="input" type="text" placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))} maxLength={6} style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '20px' }} />
                </div>
                {errors.global && <p style={{ color: 'var(--accent)', fontSize: 13, margin: '0' }}>{errors.global}</p>}
                
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-accent" style={{ width: '100%', justifyContent: 'center', fontSize: 14, opacity: loading || otp.length !== 6 ? 0.7 : 1, marginTop: 4 }}>
                  {loading ? <><Spinner />Verifying…</> : 'Verify OTP →'}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button type="button" onClick={handleResendOTP} disabled={resending} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'var(--font-sans)' }}>
                    {resending ? 'Resending...' : "Didn't receive code? Resend OTP"}
                  </button>
                </div>

                <button type="button" onClick={() => { setStep('login'); setOtp(''); setErrors({}); }} style={{ background: 'none', border: '1px solid var(--line)', padding: '12px', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', marginTop: '8px', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                  Back to Login
                </button>
              </form>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="auth-shell" style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 18, left: 18, right: 18, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L9 5.5H3L6 1Z" fill="white"/><path d="M3 5.5L1.5 11H10.5L9 5.5H3Z" fill="white" opacity=".65"/>
            </svg>
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--white)' }}>Focusaint</span>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Suspense fallback={<LoginFallback />}>
        <LoginContent />
      </Suspense>
    </GoogleOAuthProvider>
  )
}

function MagicSent({ email }) {
  return (
    <div className="fade-in" style={{ textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', margin: '0 auto 24px',
        border: '1px solid rgba(196,150,58,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>✦</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 10 }}>
        Check your inbox.
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 6 }}>
        A magic sign-in link was sent to
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--white)', marginBottom: 28 }}>{email}</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)' }}>
        Didn't receive it?{' '}
        <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Try again</a>
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--white)">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}
