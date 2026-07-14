'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const THEMES = [
  { id: 'green', label: 'Forest', primary: '#3B7A57' },
  { id: 'amber', label: 'Amber', primary: '#C97A22' },
  { id: 'red', label: 'Rose', primary: '#B5402F' },
]

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [theme, setTheme] = useState('green')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          setDisplayName(data.display_name ?? '')
          setSavedName(data.display_name ?? '')
        }
      } catch {}

      const savedDark = localStorage.getItem('ss-mode') === 'dark'
      const savedTheme = localStorage.getItem('ss-theme') ?? 'green'
      setIsDark(savedDark)
      setTheme(savedTheme)
      setLoading(false)
    }
    load()
  }, [supabase.auth])

  function handleDarkToggle() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('ss-mode', next ? 'dark' : 'light')
    if (next) {
      document.documentElement.setAttribute('data-mode', 'dark')
    } else {
      document.documentElement.removeAttribute('data-mode')
    }
  }

  function handleThemeSelect(t: string) {
    setTheme(t)
    localStorage.setItem('ss-theme', t)
    if (t === 'green') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', t)
    }
  }

  async function handleSaveName() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      })
      if (res.ok) {
        setSavedName(displayName)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {}
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleDeleteData() {
    if (!confirm('This will delete all your practice data. This cannot be undone. Continue?')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const supabaseAdmin = createClient()
    await supabaseAdmin.from('attempts').delete().eq('user_id', user.id)
    await supabaseAdmin.from('topic_progress').delete().eq('user_id', user.id)
    await supabaseAdmin.from('profiles').delete().eq('id', user.id)
    alert('Practice data has been deleted.')
  }

  if (loading) {
    return (
      <main>
        <div style={{ height: '24px', margin: '24px 0' }} className="skeleton" />
        <div style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} className="skeleton" />
        <div style={{ height: '16px', marginTop: '32px' }} className="skeleton" />
      </main>
    )
  }

  return (
    <main>
      <div className="section-head" style={{ marginTop: '24px' }}>
        <h2>Settings</h2>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div style={{ marginBottom: '16px' }}>
          <Label>Email</Label>
          <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: '4px 0 0' }}>{email}</p>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <Label htmlFor="displayName">Display Name</Label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={{
                flex: 1,
                background: 'var(--bg)',
                border: '1px solid var(--rule-strong)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                fontSize: '14px',
                color: 'var(--ink)',
                fontFamily: 'var(--body)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSaveName}
              disabled={saving || displayName === savedName}
              className="btn btn-primary"
              style={{ padding: '10px 16px', fontSize: '13px' }}
            >
              {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Row>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--ink)' }}>Dark Mode</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>Switch between light and dark appearance</div>
          </div>
          <Toggle checked={isDark} onChange={handleDarkToggle} />
        </Row>

        <div style={{ marginTop: '20px' }}>
          <Label>Accent Theme</Label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleThemeSelect(t.id)}
                style={{
                  width: '80px', height: '80px',
                  borderRadius: 'var(--radius-lg)',
                  border: theme === t.id ? '2px solid var(--ink)' : '1px solid var(--rule)',
                  background: 'var(--bg-raised)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                  transition: 'border-color 0.2s',
                  padding: '0',
                }}
              >
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  background: t.primary,
                  border: '2px solid var(--rule)',
                }} />
                <span style={{
                  fontSize: '12px', fontWeight: 500,
                  color: theme === t.id ? 'var(--ink)' : 'var(--ink-soft)',
                  fontFamily: 'var(--body)',
                }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Account */}
      <Section title="Account">
        <Row>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--ink)' }}>Sign Out</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>Sign out of your account on this device</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
            Sign Out
          </button>
        </Row>

        <Row style={{ marginTop: '0' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--red)' }}>Delete Practice Data</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>Remove all attempts and progress</div>
          </div>
          <button onClick={handleDeleteData} style={{
            padding: '8px 16px', fontSize: '13px',
            background: 'transparent', border: '1px solid var(--red)',
            color: 'var(--red)', borderRadius: 'var(--radius)',
            cursor: 'pointer', fontFamily: 'var(--body)', fontWeight: 500,
          }}>
            Delete
          </button>
        </Row>
      </Section>

      {/* About */}
      <Section title="About">
        <Row>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--ink)' }}>BSEK Board Exam Prep</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>Version 0.1.0</div>
          </div>
        </Row>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      marginBottom: '16px',
    }}>
      <div style={{
        fontFamily: 'var(--display)', fontSize: '16px', fontWeight: 600,
        color: 'var(--ink)', marginBottom: '16px',
        paddingBottom: '12px', borderBottom: '1px solid var(--rule)',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{
      fontFamily: 'var(--mono)', fontSize: '11px',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      color: 'var(--ink-faint)',
    }}>
      {children}
    </label>
  )
}

function Row({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid var(--rule)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: '44px', height: '24px',
        borderRadius: '12px',
        background: checked ? 'var(--primary)' : 'var(--rule-strong)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        padding: '0',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '18px', height: '18px',
        borderRadius: '50%',
        background: 'var(--bg-raised)',
        position: 'absolute',
        top: '3px',
        left: checked ? '23px' : '3px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}
