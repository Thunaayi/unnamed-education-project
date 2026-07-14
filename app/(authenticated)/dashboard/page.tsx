'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TopicWithProgress } from '@/types'
import { IconPin } from '@/app/components/icons'

interface Stats {
  total_attempts: number
  accuracy: number
  today_attempts: number
  topics_practiced: number
  streak_days: number
  weak_topics?: { name: string; accuracy: number }[]
}

interface SubjectStat {
  subject: string
  accuracy: number
  count: number
  weakTopics: string[]
}

function getConfidenceLabel(acc: number) {
  if (acc >= 75) return { label: 'Mastered', class: 'mastered' }
  if (acc >= 50) return { label: 'Strong', class: 'strong' }
  if (acc >= 25) return { label: 'Improving', class: 'improving' }
  return { label: 'Weak', class: 'weak' }
}

export default function DashboardPage() {
  const [recommendations, setRecommendations] = useState<TopicWithProgress[]>([])
  const [subjects, setSubjects] = useState<SubjectStat[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [allTopics, setAllTopics] = useState<TopicWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<{ topic: TopicWithProgress; questions: number }[]>([])
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [recRes, topicsRes, statsRes, reviewsRes] = await Promise.all([
          fetch('/api/recommendations'),
          fetch('/api/topics'),
          fetch('/api/stats'),
          fetch('/api/reviews'),
        ])
        const [recData, topicsData, statsData, reviewsData] = await Promise.all([
          recRes.json(),
          topicsRes.json(),
          statsRes.json(),
          reviewsRes.json().catch(() => ({ total: 0 })),
        ])
        const recs: TopicWithProgress[] = recData.recommendations ?? []
        const topics: TopicWithProgress[] = topicsData.topics ?? []
        setRecommendations(recs)
        setAllTopics(topics)
        setStats(statsData)
        setReviewCount(reviewsData.total ?? 0)

        setPlan(recs.slice(0, 3).map(t => ({ topic: t, questions: 10 - (t.user_accuracy ?? 0) / 10 })))

        const subMap: Record<string, { acc: number[]; count: number; topics: any[] }> = {}
        topics.forEach(t => {
          const s = t.subject || 'General'
          if (!subMap[s]) subMap[s] = { acc: [], count: 0, topics: [] }
          if (t.user_accuracy !== null) {
            subMap[s].acc.push(t.user_accuracy)
            subMap[s].topics.push(t)
          }
          subMap[s].count++
        })
        setSubjects(Object.entries(subMap).map(([subject, v]) => {
          const accuracy = v.acc.length > 0 ? Math.round(v.acc.reduce((a, b) => a + b, 0) / v.acc.length) : 0
          const weakTopics = v.topics.filter(t => t.user_accuracy !== null && t.user_accuracy < 50).map(t => t.name)
          return { subject, accuracy, count: v.count, weakTopics }
        }))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <main>
        <div style={{ height: '24px', margin: '24px 0' }} className="skeleton" />
        <div style={{ height: '280px', borderRadius: 'var(--radius-lg)' }} className="skeleton" />
      </main>
    )
  }

  const rec = recommendations[0]
  const conf = rec ? getConfidenceLabel(rec.user_accuracy ?? 0) : null
  const totalMissionTime = plan.reduce((acc, curr) => acc + Math.round(curr.questions * 1.5), 5)

  const bestSubject = subjects.length > 0 
    ? subjects.reduce((a,b)=>a.accuracy>b.accuracy?a:b, subjects[0]) 
    : null

  const examDate = new Date(new Date().getFullYear(), 3, 15)
  if (examDate < new Date()) examDate.setFullYear(examDate.getFullYear() + 1)
  const daysUntilExam = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const examCountdown = daysUntilExam <= 0 ? 'Exam day!' : `${daysUntilExam}d till exams`

  return (
    <main>
      <div className="bento-grid">

        {/* Top Row: Greeting + Stats */}
        <div className="bento-full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '20px', color: 'var(--ink)' }}>Good morning.</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink-faint)' }}>
            {stats && (
              <>
                <span>{stats.streak_days}d streak</span>
                <span style={{ color: 'var(--rule-strong)' }}>·</span>
                <span>{stats.today_attempts} qs today</span>
                <span style={{ color: 'var(--rule-strong)' }}>·</span>
              </>
            )}
            <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{examCountdown}</span>
          </div>
        </div>

        {/* Hero Recommendation */}
        <div className="bento-full">
          {rec ? (
            <div className={`smart-hero ${rec.priority === 'high' ? 'urgent-priority' : 'high-priority'}`} style={{ marginTop: 0 }}>
              <div className="smart-hero-header">
                <span className={`priority-pill ${rec.priority === 'high' ? 'urgent' : 'high'}`}>
                  <svg viewBox="0 0 8 8" width="6" height="6" style={{ marginRight: '4px', verticalAlign: 'middle' }}><circle cx="4" cy="4" r="2.5" fill="currentColor" /></svg> {rec.priority === 'high' ? 'Urgent Priority' : 'Priority Topic'}
                </span>
                <div className="est-time">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  18 min
                </div>
              </div>
              <h3>Study next</h3>
              <h2>{rec.name}</h2>
              <ul className="hero-reasons">
                <li>Appeared in <strong>{rec.frequency} of your last 10 practice exams</strong></li>
                <li>Your confidence: <strong style={{ color: 'var(--ink)' }}>{conf?.label}</strong></li>
                <li>Recommended to improve overall {rec.subject.toLowerCase()} score</li>
              </ul>
              <div className="hero-actions">
                <Link href={`/practice/${rec.id}`} className="btn btn-primary">Begin 18-minute session</Link>
                <Link href="/topics" className="btn btn-ghost">Show another recommendation</Link>
              </div>
            </div>
          ) : (
            <div className="smart-hero" style={{ marginTop: 0 }}>
              <h2>Ready to begin?</h2>
              <p style={{ color: 'var(--ink-soft)', marginBottom: '24px' }}>Start practicing to get personalized recommendations.</p>
              <div className="hero-actions">
                <Link href="/topics" className="btn btn-primary">Browse topics</Link>
              </div>
            </div>
          )}
        </div>

        {/* Mission + Overview side by side */}
        {plan.length > 0 && (
          <>
            <div className="bento-card">
              <div className="bento-card-title">Today&apos;s Mission</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {stats && stats.weak_topics && stats.weak_topics.length > 0 && (
                  <Link href="/practice/mistakes?mistakes_only=true" className="mission-phase" style={{ padding: '10px 0' }}>
                    <div className="phase-icon" style={{ width: '20px', height: '20px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div className="phase-content">
                      <div className="phase-title" style={{ fontSize: '13px', color: 'var(--red)' }}>Mistake Clearing</div>
                      <div className="phase-desc" style={{ fontSize: '12px' }}>Past incorrect answers</div>
                    </div>
                    <div className="phase-time">~10 min</div>
                  </Link>
                )}
                <Link href={`/practice/${plan[0]?.topic.id}?mode=warmup`} className="mission-phase" style={{ padding: '10px 0' }}>
                  <div className="phase-icon done" style={{ width: '20px', height: '20px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12"><path d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div className="phase-content">
                    <div className="phase-title" style={{ fontSize: '13px' }}>Warm-up</div>
                    <div className="phase-desc" style={{ fontSize: '12px' }}>Key terms recall</div>
                  </div>
                  <div className="phase-time">~3 min</div>
                </Link>
                <Link href={`/practice/${plan[0]?.topic.id}`} className="mission-phase" style={{ padding: '10px 0' }}>
                  <div className="phase-icon active" style={{ width: '20px', height: '20px' }} />
                  <div className="phase-content">
                    <div className="phase-title" style={{ fontSize: '13px' }}>{plan[0]?.topic.name}</div>
                    <div className="phase-desc" style={{ fontSize: '12px' }}>Main practice session</div>
                  </div>
                  <div className="phase-time">~{Math.round((plan[0]?.questions || 10) * 1.5)} min</div>
                </Link>
                <Link href={`/practice/${plan[1]?.topic.id}`} className="mission-phase" style={{ padding: '10px 0', borderBottom: 'none' }}>
                  <div className="phase-icon" style={{ width: '20px', height: '20px' }} />
                  <div className="phase-content">
                    <div className="phase-title" style={{ fontSize: '13px' }}>Mixed Practice</div>
                    <div className="phase-desc" style={{ fontSize: '12px' }}>{plan[1]?.topic.name}</div>
                  </div>
                  <div className="phase-time">~{Math.round((plan[1]?.questions || 5) * 1.5)} min</div>
                </Link>
              </div>
              <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-faint)', textAlign: 'right' }}>
                Est. {totalMissionTime} min total
              </div>
            </div>

            <div className="bento-card">
              <div className="bento-card-title">Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="stat" style={{ padding: '12px', margin: 0 }}>
                  <div className="stat-value" style={{ fontSize: '18px' }}>{stats?.streak_days ?? 0}</div>
                  <div className="stat-label" style={{ fontSize: '11px' }}>day streak</div>
                </div>
                <div className="stat" style={{ padding: '12px', margin: 0 }}>
                  <div className="stat-value" style={{ fontSize: '18px' }}>{stats?.topics_practiced ?? 0}/{allTopics.length}</div>
                  <div className="stat-label" style={{ fontSize: '11px' }}>topics done</div>
                </div>
                <div className="stat" style={{ padding: '12px', margin: 0 }}>
                  <div className="stat-value" style={{ fontSize: '18px' }}>{stats?.today_attempts ?? 0}</div>
                  <div className="stat-label" style={{ fontSize: '11px' }}>qs today</div>
                </div>
                <div className="stat" style={{ padding: '12px', margin: 0 }}>
                  <div className="stat-value" style={{ fontSize: '18px' }}>{reviewCount}</div>
                  <div className="stat-label" style={{ fontSize: '11px' }}>for review</div>
                </div>
              </div>
              {bestSubject && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--ink-soft)', textAlign: 'center' }}>
                  Best subject: <strong style={{ color: 'var(--ink)' }}>{bestSubject.subject}</strong>
                </div>
              )}
            </div>
          </>
        )}

        {/* Review Strip */}
        {reviewCount > 0 && (
          <Link href="/practice/mistakes?mistakes_only=true" className="bento-full bento-card" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', textDecoration: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IconPin size={16} />
              <span style={{ fontSize: '14px', color: 'var(--ink)' }}><strong>{reviewCount}</strong> mistake{reviewCount > 1 ? 's' : ''} due for review</span>
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--primary)' }}>Review &rarr;</span>
          </Link>
        )}

        {/* Subjects + Past Papers */}
        <div className="bento-card">
          <div className="bento-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Subjects</span>
            <Link href="/subjects" className="see-all" style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {subjects.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Practice to see subjects.</p>
            ) : (
              subjects.map(s => {
                const confInfo = getConfidenceLabel(s.accuracy)
                const dots = (n: number) => {
                  const filled = Math.round((s.accuracy / 100) * n)
                  return Array.from({ length: n }, (_, i) => (
                    <svg key={i} viewBox="0 0 8 8" width="7" height="7" style={{ display: 'inline', margin: '0 1px', verticalAlign: 'middle' }}>
                      <circle cx="4" cy="4" r="2.5" fill={i < filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  ))
                }
                return (
                  <Link key={s.subject} href="/subjects" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    textDecoration: 'none', fontSize: '13px',
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{s.subject}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: confInfo.class === 'mastered' ? 'var(--primary)' : 'var(--ink-faint)' }}>
                        {dots(4)}
                      </span>
                      <span className={`confidence-badge ${confInfo.class}`} style={{ fontSize: '10px', padding: '2px 8px' }}>{confInfo.label}</span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Past Paper Frequency</span>
            <Link href="/past-papers" className="see-all" style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="ppi-row" style={{ padding: '8px 0' }}>
              <div className="ppi-topic" style={{ width: '100px', fontSize: '12px' }}>Algebraic Identities</div>
              <div className="ppi-bar-container" style={{ height: '6px' }}><div className="ppi-bar" style={{ width: '92%' }}></div></div>
              <div className="ppi-pct" style={{ fontSize: '11px', width: '30px' }}>92%</div>
            </div>
            <div className="ppi-row" style={{ padding: '8px 0' }}>
              <div className="ppi-topic" style={{ width: '100px', fontSize: '12px' }}>Probability</div>
              <div className="ppi-bar-container" style={{ height: '6px' }}><div className="ppi-bar" style={{ width: '89%' }}></div></div>
              <div className="ppi-pct" style={{ fontSize: '11px', width: '30px' }}>89%</div>
            </div>
            <div className="ppi-row" style={{ padding: '8px 0', borderBottom: 'none' }}>
              <div className="ppi-topic" style={{ width: '100px', fontSize: '12px' }}>Matrices</div>
              <div className="ppi-bar-container" style={{ height: '6px' }}><div className="ppi-bar" style={{ width: '83%' }}></div></div>
              <div className="ppi-pct" style={{ fontSize: '11px', width: '30px' }}>83%</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
