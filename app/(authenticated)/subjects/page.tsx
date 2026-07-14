'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TopicWithProgress } from '@/types'

function getConfidenceLabel(acc: number) {
  if (acc >= 75) return { label: 'Mastered', class: 'mastered' }
  if (acc >= 50) return { label: 'Strong', class: 'strong' }
  if (acc >= 25) return { label: 'Improving', class: 'improving' }
  return { label: 'Weak', class: 'weak' }
}

export default function SubjectsPage() {
  const [topics, setTopics] = useState<TopicWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/topics')
      .then(r => r.json())
      .then(d => {
        setTopics(d.topics ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Group by subject
  const groups: Record<string, TopicWithProgress[]> = {}
  topics.forEach(t => {
    const s = t.subject || 'General'
    if (!groups[s]) groups[s] = []
    groups[s].push(t)
  })

  // Compute subject stats
  const entries = Object.entries(groups)
    .map(([subject, ts]) => {
      const accVals = ts.filter(t => t.user_accuracy !== null).map(t => t.user_accuracy!)
      const avgAcc = accVals.length > 0 ? Math.round(accVals.reduce((a, b) => a + b, 0) / accVals.length) : 0
      const highCount = ts.filter(t => t.priority === 'high').length
      return { subject, topics: ts, avgAcc, highCount }
    })
    .sort((a, b) => a.avgAcc - b.avgAcc)

  if (loading) {
    return (
      <main>
        <div className="section-head" style={{ marginTop: '22px' }}>
          <h2>Subjects</h2>
          <span className="eyebrow">loading...</span>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="section-head" style={{ marginTop: '22px' }}>
        <h2>Subjects</h2>
        <span className="eyebrow">{entries.length} subjects</span>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginTop: '-4px', marginBottom: '24px' }}>
        Your mastery and recommended focus areas for each subject.
      </p>

      <div className="subject-grid">
        {entries.map(({ subject, topics, avgAcc, highCount }) => {
          const confInfo = getConfidenceLabel(avgAcc)
          
          // Sort topics to show weakest/high priority first
          const sortedTopics = [...topics].sort((a, b) => {
            const accA = a.user_accuracy ?? 100
            const accB = b.user_accuracy ?? 100
            return accA - accB
          })
          
          const actionItems = sortedTopics.slice(0, 4) // show up to 4 items
          
          return (
            <div key={subject} className="subject-card">
              <div className="subject-card-head">
                <div className="subject-card-title">{subject}</div>
                <span className={`confidence-badge ${confInfo.class}`}>{confInfo.label}</span>
              </div>
              <div className="subject-card-stats">
                {topics.length} chapters · {highCount > 0 ? `${highCount} urgent` : 'On track'}
              </div>
              <div className="subject-card-divider" />
              
              <div style={{ flex: 1, marginBottom: '16px' }}>
                <div className="eyebrow" style={{ marginBottom: '8px' }}>Action Items</div>
                {actionItems.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--ink-soft)' }}>
                    {actionItems.map(wt => (
                      <li key={wt.id} style={{ marginBottom: '6px' }}>
                        <Link href={`/practice/${wt.id}`} style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                          <span style={{ textDecoration: 'underline' }}>{wt.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>No critical weaknesses detected.</div>
                )}
              </div>

              <div className="subject-card-footer">
                <div className="subject-card-detail"></div>
                <Link href={`/topics`} className="subject-card-action">Browse all chapters &rarr;</Link>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
