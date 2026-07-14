'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Fuse from 'fuse.js'
import type { User } from '@supabase/supabase-js'

interface SearchItem {
  id: string
  name: string
  subject: string
}

export default function Topbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [allTopics, setAllTopics] = useState<SearchItem[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fuseRef = useRef<Fuse<SearchItem> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStreak(d.streak_days ?? 0); setXp(d.xp ?? 0) })
      .catch(() => {})

    fetch('/api/topics')
      .then(r => r.json())
      .then(d => {
        const topics: SearchItem[] = (d.topics ?? []).map((t: { id: string; name: string; subject: string }) => ({
          id: t.id, name: t.name, subject: t.subject,
        }))
        setAllTopics(topics)
        fuseRef.current = new Fuse(topics, {
          keys: ['name', 'subject'],
          threshold: 0.4,
        })
      })
      .catch(() => {})

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    const saved = localStorage.getItem('ss-mode')
    if (saved === 'dark') {
      setIsDark(true)
      document.documentElement.setAttribute('data-mode', 'dark')
    }
  }, [])

  useEffect(() => {
    if (!searchQuery.trim() || !fuseRef.current) {
      setSearchResults([])
      return
    }
    const results = fuseRef.current.search(searchQuery).slice(0, 8).map(r => r.item)
    setSearchResults(results)
    setSelectedIdx(-1)
  }, [searchQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setShowResults(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function toggleMode() {
    const nextMode = !isDark
    setIsDark(nextMode)
    localStorage.setItem('ss-mode', nextMode ? 'dark' : 'light')
    if (nextMode) {
      document.documentElement.setAttribute('data-mode', 'dark')
    } else {
      document.documentElement.removeAttribute('data-mode')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleSelect(topicId: string) {
    setShowResults(false)
    setSearchQuery('')
    router.push(`/practice/${topicId}`)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link href="/dashboard" className="logo-mark" aria-label="Dashboard">
          <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
            <rect x="3" y="5" width="26" height="22" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <line x1="8" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: '24px' }}>
        <Link href="/dashboard" className="logo-mark mobile-logo" style={{ display: 'none', marginRight: 'auto' }} aria-label="Dashboard">
          <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
            <rect x="3" y="5" width="26" height="22" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <line x1="8" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </Link>
        <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search topics, past papers..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIdx(i => Math.min(i + 1, searchResults.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIdx(i => Math.max(i - 1, 0))
              } else if (e.key === 'Enter' && selectedIdx >= 0 && searchResults[selectedIdx]) {
                handleSelect(searchResults[selectedIdx].id)
              } else if (e.key === 'Escape') {
                setShowResults(false)
                inputRef.current?.blur()
              }
            }}
          />
          <span className="kbd">⌘K</span>
          {showResults && searchQuery.trim() && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              marginTop: '4px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              zIndex: 100,
              maxHeight: '300px', overflowY: 'auto',
            }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--ink-faint)' }}>
                  No results found
                </div>
              ) : (
                searchResults.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 16px', fontSize: '14px', color: 'var(--ink)',
                      background: i === selectedIdx ? 'var(--bg-sunken)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--rule)',
                      fontFamily: 'var(--body)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; setSelectedIdx(i) }}
                    onMouseLeave={e => { e.currentTarget.style.background = i === selectedIdx ? 'var(--bg-sunken)' : 'transparent' }}
                  >
                    <div style={{ fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>{r.subject}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-tools">
        {xp > 0 && (
          <div className="streak-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            {xp.toLocaleString()}
          </div>
        )}
        {streak > 0 && (
          <div className="streak-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M12 21c-3.3 0-6-2.4-6-5.8 0-2.6 1.6-4 2.6-5.7.5 1 .3 2 .9 2 .7 0 .6-2.7 0-4.5-.4-1.2-.2-2.4.5-3 1 2.6 3 3.4 4.3 5.4 1 1.6 1.7 3 1.7 4.8 0 3.4-2.7 5.8-6 5.8z" />
            </svg>
            {streak}
          </div>
        )}
        <button className="icon-btn" onClick={toggleMode} aria-label="Toggle dark mode">
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        {!loading && user && (
          <button onClick={handleLogout} className="btn btn-ghost signout-btn" style={{ padding: '6px 12px' }}>
            Sign out
          </button>
        )}
      </div>
    </header>
  )
}
