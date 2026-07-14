'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PracticeQuestion from '@/app/components/practice-question'
import type { QuestionWithOptions } from '@/types'

export default function PracticePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const topicId = params.topicId as string
  const mode = searchParams.get('mode')
  const examMode = searchParams.get('exam_mode') === 'true'
  const mistakesOnly = searchParams.get('mistakes_only') === 'true'

  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [lastFeedback, setLastFeedback] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // Handle special mistakes_only route correctly
      let url = `/api/questions?limit=${examMode ? 20 : 5}`
      if (examMode) {
        url += `&exam_id=${topicId}`
      } else if (topicId && topicId !== 'mistakes') {
        url += `&topic_id=${topicId}`
      }
      if (mistakesOnly) {
        url += `&mistakes_only=true`
      }

      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load questions'); setLoading(false); return }
      setQuestions(data.questions)
      setLoading(false)
    }
    load()
  }, [topicId])

  async function handleAnswer(questionId: string, isCorrect: boolean) {
    setSubmitting(true)
    setSessionStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) }))
    setLastFeedback(isCorrect ? 'right' : 'wrong')
    try {
      await fetch('/api/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, is_correct: isCorrect }),
      })
    } catch {}
    setSubmitting(false)
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setLastFeedback(null)
    } else {
      setFinished(true)
    }
  }

  function handleSkip() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setLastFeedback(null)
    } else {
      setFinished(true)
    }
  }

  if (loading) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
        <span className="eyebrow">Loading questions...</span>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--red)' }}>{error}</p>
        <Link href="/topics" className="see-all" style={{ marginTop: '16px', display: 'inline-block' }}>Back to topics</Link>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-soft)' }}>No questions available for this topic yet.</p>
        <Link href="/topics" className="see-all" style={{ marginTop: '16px', display: 'inline-block' }}>Back to topics</Link>
      </main>
    )
  }

  if (finished) {
    const acc = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0
    return (
      <main>
        <div className="notebook-hero" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="hero-date">Session complete</div>
          <div className="hero-prompt" style={{ fontSize: '24px', marginTop: '16px' }}>
            You got <span className="hero-topic" style={{ fontSize: '24px' }}>{sessionStats.correct}/{sessionStats.total}</span> correct
          </div>

          <div className="stat-strip" style={{ marginTop: '24px' }}>
            <div className="stat">
              <div className="stat-value">{sessionStats.total}</div>
              <div className="stat-label">attempted</div>
            </div>
            <div className="stat">
              <div className="stat-value">{sessionStats.correct}</div>
              <div className="stat-label">correct</div>
            </div>
            <div className="stat">
              <div className="stat-value">{acc}%</div>
              <div className="stat-label">accuracy</div>
            </div>
          </div>

          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
            <button onClick={() => { setCurrentIndex(0); setFinished(false); setSessionStats({ total: 0, correct: 0 }); setLastFeedback(null) }}
              className="btn btn-ghost">Practice again</button>
            <Link href={examMode ? '/past-papers' : '/dashboard'} className="btn btn-primary">{examMode ? 'Back to papers' : 'Back to dashboard'}</Link>
          </div>
        </div>
      </main>
    )
  }

  const current = questions[currentIndex]

  return (
    <main>
      <PracticeQuestion
        key={current.id + currentIndex}
        question={current}
        onAnswer={handleAnswer}
        questionNumber={currentIndex}
        totalQuestions={questions.length}
        mode={mode ?? undefined}
      />

      <div className="practice-footer">
        <button onClick={handleSkip} className="skip-link" style={{ background: 'none', border: 'none', padding: 0 }}>
          Skip this one
        </button>
        <button
          onClick={handleNext}
          disabled={submitting || !lastFeedback}
          className={`btn ${lastFeedback ? 'btn-primary' : 'btn-primary'}`}
          style={{ opacity: !lastFeedback ? 0.4 : 1 }}
        >
          {currentIndex < questions.length - 1 ? 'Next question' : 'See results'}
        </button>
      </div>
    </main>
  )
}
