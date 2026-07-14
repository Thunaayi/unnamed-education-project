'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Exam {
  id: string
  year: number
  subject: string
  board: string
  grade: number
  group: string
  total_marks: number
  question_count: { total: number; mcq: number; short: number; detailed: number }
}

export default function PastPapersPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  useEffect(() => {
    fetch('/api/exams')
      .then(r => r.json())
      .then(d => {
        setExams(d.exams ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const subjects = [...new Set(exams.map(e => e.subject))].sort()
  const years = [...new Set(exams.map(e => e.year))].sort((a, b) => b - a)

  const filtered = exams.filter(e => {
    if (subjectFilter && e.subject !== subjectFilter) return false
    if (yearFilter && e.year !== Number(yearFilter)) return false
    return true
  })

  if (loading) {
    return (
      <main>
        <div style={{ height: '24px', margin: '24px 0' }} className="skeleton" />
        <div style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} className="skeleton" />
      </main>
    )
  }

  return (
    <main>
      <div className="section-head" style={{ marginTop: '24px' }}>
        <h2>Past Papers</h2>
        <span className="eyebrow">{exams.length} exams</span>
      </div>

      <div className="filter-row">
        <button
          className={`chip ${!subjectFilter ? 'active' : ''}`}
          onClick={() => setSubjectFilter('')}
        >
          All Subjects
        </button>
        {subjects.map(s => (
          <button
            key={s}
            className={`chip ${subjectFilter === s ? 'active' : ''}`}
            onClick={() => setSubjectFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <button
          className={`chip ${!yearFilter ? 'active' : ''}`}
          onClick={() => setYearFilter('')}
        >
          All Years
        </button>
        {years.map(y => (
          <button
            key={y}
            className={`chip ${yearFilter === String(y) ? 'active' : ''}`}
            onClick={() => setYearFilter(String(y))}
          >
            {y}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginTop: '24px' }}>
          No past papers match this filter.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {filtered.map(exam => (
            <Link
              key={exam.id}
              href={`/practice/${exam.id}?exam_mode=true`}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--rule)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                textDecoration: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.transform = 'none' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--ink)' }}>
                  {exam.subject} — {exam.year}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  {exam.board} Grade {exam.grade} · {exam.group} · {exam.total_marks} marks
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink-faint)' }}>
                <div>{exam.question_count.total} questions</div>
                <div style={{ marginTop: '2px' }}>
                  {exam.question_count.mcq} MCQ · {exam.question_count.short} short · {exam.question_count.detailed} long
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
