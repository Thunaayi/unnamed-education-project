'use client'

import { useState } from 'react'
import type { QuestionWithOptions } from '@/types'

interface Props {
  question: QuestionWithOptions
  onAnswer: (questionId: string, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
  mode?: string
}

export default function PracticeQuestion({ question, onAnswer, questionNumber, totalQuestions, mode }: Props) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [selfGrade, setSelfGrade] = useState<boolean | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loadingExplain, setLoadingExplain] = useState(false)

  function handleSelectOption(optionId: string) {
    if (answered) return
    setSelectedOption(optionId)
    setAnswered(true)

    const option = question.options.find(o => o.id === optionId)
    const correct = option?.is_correct ?? false
    setFeedbackText(correct
      ? "Right. That's the identity you'll want to recall fast on exam day."
      : "Not quite. Check the explanation below, then try a similar question tomorrow."
    )
    onAnswer(question.id, correct)
  }

  function handleSelfGrade(correct: boolean) {
    setSelfGrade(correct)
    setAnswered(true)
    setFeedbackText(correct
      ? "Marked as correct — good recall."
      : "Noted for improvement — review the steps and try again soon."
    )
    onAnswer(question.id, correct)
  }

  async function handleExplain() {
    if (loadingExplain || explanation) return
    setLoadingExplain(true)
    try {
      const res = await fetch(`/api/explain?question_id=${question.id}`)
      const data = await res.json()
      setExplanation(data.explanation || 'No explanation available.')
    } catch {
      setExplanation('Failed to load explanation.')
    }
    setLoadingExplain(false)
  }

  function getOptionClass(option: { id: string; is_correct: boolean }) {
    if (!answered || selectedOption === null) return ''
    if (option.is_correct) return 'correct'
    if (option.id === selectedOption && !option.is_correct) return 'wrong'
    return ''
  }

  const mcqCorrect = selectedOption
    ? question.options.find(o => o.id === selectedOption)?.is_correct
    : null

  const isFlashcardMode = mode === 'warmup'

  return (
    <div className="practice-shell">
      {/* Progress dots */}
      <div className="practice-progress">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <span key={i} className={
            i < questionNumber ? 'done' :
            i === questionNumber ? 'current' : ''
          } />
        ))}
      </div>

      {/* Eyebrow */}
      <div className="q-eyebrow">
        <span className="eyebrow">{isFlashcardMode ? 'Flashcard Warm-up' : `Question ${questionNumber + 1} of ${totalQuestions}`}</span>
        <span className="eyebrow">{typeof question.topic === 'object' && question.topic ? (question.topic as unknown as { name: string }).name : ''}</span>
      </div>

      {/* Question text */}
      <div className="q-text">{question.question_text}</div>

      {/* FLASHCARD MODE (Active Recall) */}
      {isFlashcardMode && question.type === 'mcq' && (
        <div style={{ marginTop: '20px' }}>
          {!revealed && !answered && (
            <button
              onClick={() => setRevealed(true)}
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center', padding: '24px' }}
            >
              Flip Card / Reveal Answer
            </button>
          )}

          {revealed && !answered && (
            <div style={{ animation: 'fade-in 0.3s ease-out' }}>
              <div style={{
                border: '1px solid var(--rule-strong)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                background: 'var(--bg-raised)',
                fontSize: '16px',
                color: 'var(--ink)',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <strong>Correct Answer:</strong><br />
                {question.options.find(o => o.is_correct)?.option_text || 'Not found'}
              </div>

              <p style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--ink-soft)' }}>Did you recall this correctly?</p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleSelfGrade(true)}
                  className="btn btn-primary"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  Yes, I knew it
                </button>
                <button
                  onClick={() => handleSelfGrade(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  No, I forgot
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MCQ Options (Standard Mode) */}
      {!isFlashcardMode && question.type === 'mcq' && question.options.length > 0 && (
        <div className="option-list">
          {question.options.map((option, i) => (
            <button
              key={option.id}
              className={`option ${selectedOption === option.id ? 'selected' : ''} ${answered ? getOptionClass(option) : ''}`}
              onClick={() => handleSelectOption(option.id)}
            >
              <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
              <span>{option.option_text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Short / Detailed Answer */}
      {(question.type === 'short_answer' || question.type === 'detailed_answer') && (
        <div style={{ marginTop: '20px' }}>
          {!revealed && !answered && (
            <button
              onClick={() => setRevealed(true)}
              className="btn btn-ghost"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Reveal rubric / ideal answer
            </button>
          )}

          {revealed && !answered && (
            <>
              <div style={{
                border: '1px solid var(--rule-strong)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                background: 'var(--bg-raised)',
                fontSize: '14px',
                color: 'var(--ink-soft)',
                marginBottom: '16px'
              }}>
                {question.alternative_text || 'Check your answer against the marking scheme. Did you include the key steps and final answer?'}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleSelfGrade(true)}
                  className="btn btn-primary"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  I got it right
                </button>
                <button
                  onClick={() => handleSelfGrade(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  Needs improvement
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Feedback & AI Explain */}
      {answered && (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {feedbackText && (
            <div className={`feedback-note show ${mcqCorrect !== undefined ? (mcqCorrect ? 'right' : 'wrong') : (selfGrade ? 'right' : 'wrong')}`}>
              {feedbackText}
            </div>
          )}

          {/* AI Explain Button if answered wrong (or marked wrong in self-grade) */}
          {((mcqCorrect === false) || (selfGrade === false)) && !explanation && (
            <button 
              onClick={handleExplain} 
              className="btn btn-ghost" 
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={loadingExplain}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {loadingExplain ? 'Generating...' : 'Explain this'}
            </button>
          )}

          {/* AI Explanation Text */}
          {explanation && (
            <div style={{ padding: '16px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius)', border: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--primary)', fontWeight: 500, fontSize: '13px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                AI Model Answer
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br/>') }} />
            </div>
          )}
        </div>
      )}

      {/* Spacer for practice footer placed in parent */}
    </div>
  )
}
