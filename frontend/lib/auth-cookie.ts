import { setUserContext, clearUserContext } from './sentry';

const COOKIE_NAME = 'focusaint_token'
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

export function persistAuthToken(token: string, user?: { id: string; email?: string; name?: string }) {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
  setAuthCookie(token)
  
  // Set user context in Sentry if user data is provided
  if (user) {
    setUserContext({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
  clearAuthCookie()
  
  // Clear user context in Sentry
  clearUserContext();
}

export { COOKIE_NAME }