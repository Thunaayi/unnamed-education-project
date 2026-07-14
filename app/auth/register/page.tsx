'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/auth/login?confirmed=check_email')
    router.refresh()
  }

  return (
    <main style={{ maxWidth: '400px', margin: '60px auto 0', padding: '0 20px' }}>
      <div className="notebook-hero" style={{ padding: '32px 24px' }}>
        <div className="hero-date">Get started</div>
        <div className="hero-prompt" style={{ fontSize: '20px', marginTop: '16px' }}>
          Create your <span className="hero-topic" style={{ fontSize: '20px' }}>study space</span>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', border: '1px solid var(--rule-strong)', borderRadius: 'var(--radius)',
                padding: '11px 14px', fontSize: '14px', background: 'var(--bg-raised)', color: 'var(--ink)',
                outline: 'none', fontFamily: 'var(--body)'
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%', border: '1px solid var(--rule-strong)', borderRadius: 'var(--radius)',
                padding: '11px 14px', fontSize: '14px', background: 'var(--bg-raised)', color: 'var(--ink)',
                outline: 'none', fontFamily: 'var(--body)'
              }}
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--high)' }}>{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ textAlign: 'center' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--ink-soft)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </main>
  )
}
