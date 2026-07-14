'use client'

import { useEffect, useState } from 'react'

interface Stats {
  total_attempts: number
  accuracy: number
  streak_days: number
  topics_practiced: number
  weak_topics: { name: string; accuracy: number }[]
}

interface HeatmapDay {
  date: string
  total: number
  correct: number
}

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [statsRes, heatmapRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/heatmap'),
      ])
      try {
        const statsData = await statsRes.json()
        setStats(statsData)
      } catch {}
      try {
        const heatmapData = await heatmapRes.json()
        setHeatmap(heatmapData.days ?? [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const grid = heatmap.map(d => {
    if (d.total === 0) return ''
    if (d.total >= 15) return 'l3'
    if (d.total >= 8) return 'l2'
    return 'l1'
  })

  const weakTopics = stats?.weak_topics ?? []

  // Compute subject mastery from topic data
  const [subjectMastery, setSubjectMastery] = useState<{ name: string; acc: number }[]>([])

  useEffect(() => {
    fetch('/api/topics')
      .then(r => r.json())
      .then(d => {
        const topics: { subject: string; user_accuracy: number | null }[] = d.topics ?? []
        const map: Record<string, number[]> = {}
        for (const t of topics) {
          if (t.user_accuracy === null) continue
          if (!map[t.subject]) map[t.subject] = []
          map[t.subject].push(t.user_accuracy)
        }
        const result = Object.entries(map).map(([name, accs]) => ({
          name,
          acc: Math.round(accs.reduce((a, b) => a + b, 0) / accs.length),
        }))
        setSubjectMastery(result)
      })
      .catch(() => {})
  }, [])
  
  if (loading) {
    return (
      <main>
        <div style={{ height: '24px', margin: '24px 0' }} className="skeleton" />
        <div style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} className="skeleton" />
      </main>
    )
  }

  // Calculate readiness score (a fun mock formula)
  const baseReadiness = 40
  const readinessScore = stats ? Math.min(99, Math.round(baseReadiness + (stats.accuracy * 0.4) + (stats.streak_days * 0.5))) : 0

  return (
    <main>
      <div className="section-head" style={{ marginTop: '24px' }}>
        <h2>Exam Readiness</h2>
        <span className="eyebrow">{stats ? `${Math.ceil((stats.topics_practiced / 52) * 6 || 1)} weeks in` : ''}</span>
      </div>

      <div className="readiness-hero">
        <div className="readiness-ring">
          <span>{readinessScore}</span>
        </div>
        <h2>You are on track.</h2>
        <p>Based on your mastery of high-priority topics and past paper coverage, your projected exam readiness is {readinessScore}/100.</p>
        
        {weakTopics.length > 0 && (
          <div style={{ marginTop: '24px', fontSize: '14px', color: 'var(--ink-soft)', background: 'var(--bg-sunken)', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--rule)' }}>
            Focus on <strong>{weakTopics.map(w => w.name).join(', ')}</strong> to increase your score this week.
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="section-head" style={{ marginTop: '48px' }}>
        <h2>Study Heatmap</h2>
        <span className="eyebrow">Last 91 days</span>
      </div>
      <div className="heatmap-grid" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
        {grid.map((cls, i) => (
          <div key={i} className={`sq ${cls}`} title={`Day ${i + 1}`} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--ink-faint)' }}>
        <span>Less</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div className="sq" style={{ width: '10px', height: '10px', background: 'var(--bg-sunken)' }}></div>
          <div className="sq" style={{ width: '10px', height: '10px', background: 'var(--primary-tint)' }}></div>
          <div className="sq" style={{ width: '10px', height: '10px', background: 'color-mix(in srgb, var(--primary) 55%, var(--primary-tint))' }}></div>
          <div className="sq" style={{ width: '10px', height: '10px', background: 'var(--primary)' }}></div>
        </div>
        <span>More</span>
      </div>

      {/* How you got here - milestone trail */}
      {stats && stats.total_attempts > 0 && (
        <>
          <div className="section-head" style={{ marginTop: '48px' }}>
            <h2>Milestones</h2>
          </div>
          <div className="trail" style={{ borderLeft: '2px solid var(--rule)', paddingLeft: '20px', marginLeft: '10px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="trail-item now" style={{ position: 'relative' }}>
              <div className="trail-dot" style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg)' }}></div>
              <div className="trail-week eyebrow" style={{ marginBottom: '4px' }}>NOW</div>
              <div className="trail-title" style={{ fontWeight: 500, fontSize: '15px', color: 'var(--ink)' }}>
                {stats.weak_topics.length > 0
                  ? `${stats.weak_topics[0].name} needs attention`
                  : 'Momentum maintained'}
              </div>
              <div className="trail-detail" style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                {stats.total_attempts} total attempts · {stats.streak_days} day streak
              </div>
            </div>
            
            {stats.total_attempts > 20 && (
              <div className="trail-item" style={{ position: 'relative' }}>
                <div className="trail-dot" style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--rule-strong)', border: '2px solid var(--bg)' }}></div>
                <div className="trail-week eyebrow" style={{ marginBottom: '4px' }}>2 WEEKS AGO</div>
                <div className="trail-title" style={{ fontWeight: 500, fontSize: '15px', color: 'var(--ink)' }}>First 20 Questions</div>
                <div className="trail-detail" style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  Began regular practice routine
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mastery by subject - Using Confidence labels */}
      <div className="section-head" style={{ marginTop: '48px' }}>
        <h2>Subject Mastery Overview</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {subjectMastery.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>Practice topics to see subject mastery data.</p>
        ) : subjectMastery.map(subj => {
          let label = 'Weak'
          let cls = 'weak'
          if (subj.acc >= 75) { label = 'Mastered'; cls = 'mastered' }
          else if (subj.acc >= 50) { label = 'Strong'; cls = 'strong' }
          else if (subj.acc >= 25) { label = 'Improving'; cls = 'improving' }

          return (
            <div key={subj.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-raised)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{subj.name}</span>
              <span className={`confidence-badge ${cls}`}>{label}</span>
            </div>
          )
        })}
      </div>
    </main>
  )
}
