'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TopicWithProgress } from '@/types'

type FilterKey = 'all' | 'high' | 'medium' | 'low' | 'weak'

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    fetch('/api/topics')
      .then(r => r.json())
      .then(d => {
        setTopics(d.topics ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = topics.filter(t => {
    if (filter === 'all') return true
    if (filter === 'weak') return t.user_accuracy !== null && t.user_accuracy < 55
    return t.priority === filter
  })

  const chips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'high', label: 'High priority' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
    { key: 'weak', label: 'Weak only' },
  ]

  function getPillClass(acc: number | null) {
    if (acc === null) return 'medium'
    if (acc >= 70) return 'low'
    if (acc >= 40) return 'medium'
    return 'high'
  }

  if (loading) {
    return (
      <main>
        <div className="section-head" style={{ marginTop: '22px' }}>
          <h2>Topic Explorer</h2>
          <span className="eyebrow">loading...</span>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="section-head" style={{ marginTop: '22px' }}>
        <h2>Topic Explorer</h2>
        <span className="eyebrow">{topics.length} topics</span>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginTop: '-4px' }}>
        Ranked by how often a topic has shown up in past papers, weighed against how well you know it.
      </p>

      <div className="filter-row">
        {chips.map(c => (
          <button
            key={c.key}
            className={`chip ${filter === c.key ? 'active' : ''}`}
            onClick={() => setFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="topic-table-head">
        <div>Topic</div>
        <div>In papers</div>
        <div>Mastery</div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: '14px', padding: '20px 0' }}>No topics match this filter.</p>
      ) : (
        filtered.map(t => {
          const acc = t.user_accuracy
          const pClass = getPillClass(acc)
          return (
            <Link key={t.id} href={`/practice/${t.id}`} className="topic-row" style={{ textDecoration: 'none' }}>
              <div>
                <div className="tr-name">{t.name}</div>
                <div className="tr-subject">{t.subject}</div>
              </div>
              <div>
                <div className="freq-ticks">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} className={i < t.frequency ? 'on' : ''} />
                  ))}
                </div>
                <div className="freq-caption">{t.frequency} / 10</div>
              </div>
              <div><span className={`pill ${pClass}`}>{acc !== null ? `${acc}%` : '—'}</span></div>
            </Link>
          )
        })
      )}
    </main>
  )
}
