'use client'
import { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '../../landing/components/ThemeToggle'
import { APIClient } from '../../../lib/api-client'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { persistAuthToken } from '../../../lib/auth-cookie'
import { useRouter } from 'next/navigation'

const goals = [
  { id: 'code',   label: 'Learn to code'        },
  { id: 'exam',   label: 'Crack an exam'        },
  { id: 'career', label: 'Grow professionally'  },
  { id: 'skills', label: 'Build new skills'     },
]

function SignupContent() {
  const [form,     setForm]     = useState({ name: '', email: '', password: '', goal: '' })
  const [errors,   setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [step,     setStep]     = useState(1) // 1 = credentials, 2 = goal
  const router = useRouter()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validateStep1 = () => {
    const e = {}
    if (!form.name.trim())           e.name     = 'Required'
    if (!form.email.includes('@'))   e.email    = 'Invalid email'
    if (form.password.length < 8)    e.password = 'Minimum 8 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const next = () => { if (validateStep1()) setStep(2) }

  const submit = async () => {
    setLoading(true)
    try {
      await APIClient.post('/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password,
        learningGoal: form.goal
      })
      
      setDone(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true)
    setErrors({})
    try {
      const data = await APIClient.post('/auth/google', { 
        accessToken: tokenResponse.access_token 
      })
      persistAuthToken(data.token)
      router.push('/dashboard')
    } catch (err) {
      alert(err.message || "Google signup failed")
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => alert("Google Login failed")
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

      {/* Left panel — brand */}
      <div style={{
        flex: '0 0 420px', display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', borderRight: '1px solid var(--line)', position: 'relative', overflow: 'hidden',
      }} className="hidden lg:flex">
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 100% 100% at 0% 0%, black 20%, transparent 80%)',
        }}/>

        <div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: 'var(--white)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>
            The only edtech that makes you <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>prove</em> you learned.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8 }}>
            No passive scrolling. No comfort watching. Gated progress that forces mastery.
          </p>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { q: '"Passed UPSC prelims after switching from YouTube."', name: 'Arjun S.', streak: 19 },
            { q: '"Got my first dev job after 41 days on Focusaint."', name: 'Daniel O.', streak: 41 },
          ].map((t, i) => (
            <div key={i} style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'rgba(245,242,238,0.7)', lineHeight: 1.65, marginBottom: 10 }}>{t.q}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--muted)' }}>{t.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)' }}>🔥 {t.streak}d</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">

          {done ? (
            <Success name={form.name} email={form.email} />
          ) : step === 1 ? (
            <Step1 form={form} set={set} errors={errors} showPass={showPass} setShowPass={setShowPass} onNext={next} onGoogleClick={loginWithGoogle} />
          ) : (
            <Step2 form={form} set={set} goals={goals} onSubmit={submit} loading={loading} onBack={() => setStep(1)} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function Signup() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <SignupContent />
    </GoogleOAuthProvider>
  )
}


function Step1({ form, set, errors, showPass, setShowPass, onNext, onGoogleClick }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Create your account
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)' }}>
          Free forever. No credit card.
        </p>
      </div>
      <div className="auth-oauth-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <button onClick={() => onGoogleClick()} style={{
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Full name" error={errors.name}>
          <input className="input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Password" error={errors.password}>
          <div style={{ position: 'relative' }}>
            <input className="input" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight: 56 }} />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em',
            }}>{showPass ? 'HIDE' : 'SHOW'}</button>
          </div>
        </Field>
      </div>

      <button onClick={onNext} className="btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 24, fontSize: 14 }}>
        Continue
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </div>
  )
}

function Step2({ form, set, goals, onSubmit, loading, onBack }) {
  return (
    <div className="fade-in">
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--muted)', marginBottom: 32, padding: 0,
        transition: 'color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          What are you here to learn?
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)' }}>
          We'll personalise your experience accordingly.
        </p>
      </div>

      <div className="auth-goals-grid" style={{ marginBottom: 28 }}>
        {goals.map(g => (
          <button key={g.id} onClick={() => set('goal', g.id)} style={{
            padding: '16px', textAlign: 'left', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, transition: 'all 0.2s',
            border: form.goal === g.id ? '1px solid rgba(200,64,42,0.5)' : '1px solid var(--line)',
            background: form.goal === g.id ? 'rgba(200,64,42,0.06)' : 'var(--surface)',
            color: form.goal === g.id ? 'var(--white)' : 'var(--muted)',
          }}>
            {g.label}
          </button>
        ))}
      </div>

      <button onClick={onSubmit} disabled={loading} className="btn-accent" style={{
        width: '100%', justifyContent: 'center', fontSize: 14,
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? (
          <><Spinner /> Creating account…</>
        ) : (
          <>Create account <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg></>
        )}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(107,104,96,0.5)', lineHeight: 1.6 }}>
        By creating an account you agree to our{' '}
        <a href="#" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Terms</a> &{' '}
        <a href="#" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Privacy Policy</a>
      </p>
    </div>
  )
}

function Success({ name, email }) {
  return (
    <div className="fade-in" style={{ textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', margin: '0 auto 24px',
        border: '1px solid rgba(74,138,74,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a8a4a" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 10 }}>
        Welcome, {name || 'Learner'}.
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>
        Your account is created! Please check your email for the verification code.
      </p>
      <Link href={`/auth/login?email=${encodeURIComponent(email)}`} className="btn-accent" style={{ fontSize: 14 }}>
        Go to Login
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: error ? 'var(--accent)' : 'var(--muted)', marginBottom: 7 }}>
        {error || label}
      </label>
      {children}
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
