import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { QuestionWithOptions } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topic_id')
  const examId = searchParams.get('exam_id')
  const mistakesOnly = searchParams.get('mistakes_only') === 'true'
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)

  if (!topicId && !mistakesOnly && !examId) {
    return NextResponse.json({ error: 'topic_id, exam_id, or mistakes_only is required' }, { status: 400 })
  }

  let topic = null
  if (topicId) {
    const { data: t } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single()
    if (t) topic = t
  }

  let available = []

  if (mistakesOnly && user) {
    // Fetch user's incorrect attempts
    let attemptsQuery = supabase
      .from('attempts')
      .select('question_id')
      .eq('user_id', user.id)
      .eq('is_correct', false)

    const { data: wrongAttempts } = await attemptsQuery

    if (!wrongAttempts || wrongAttempts.length === 0) {
      return NextResponse.json({ questions: [], topic, message: 'No mistakes found' })
    }

    const wrongIds = Array.from(new Set(wrongAttempts.map(a => a.question_id)))
    
    let questionsQuery = supabase
      .from('questions')
      .select('*')
      .in('id', wrongIds)
      
    if (topicId) {
      questionsQuery = questionsQuery.eq('topic_id', topicId)
    }

    const { data: questions } = await questionsQuery
    available = questions ?? []
  } else if (examId) {
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
    available = questions ?? []

    // Skip already-attempted if user is logged in
    if (user && available.length > 0) {
      const { data: recentAttempts } = await supabase
        .from('attempts')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', available.map(q => q.id))

      if (recentAttempts && recentAttempts.length > 0) {
        const attemptedIds = new Set(recentAttempts.map(a => a.question_id))
        const filtered = available.filter(q => !attemptedIds.has(q.id))
        if (filtered.length > 0) available = filtered
      }
    }
  } else if (topicId) {
    // Normal topic fetch
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)

    if (!questions || questions.length === 0) {
      return NextResponse.json({ questions: [], topic })
    }

    available = [...questions]

    if (user) {
      const { data: recentAttempts } = await supabase
        .from('attempts')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questions.map(q => q.id))

      if (recentAttempts && recentAttempts.length > 0) {
        const attemptedIds = new Set(recentAttempts.map(a => a.question_id))
        available = questions.filter(q => !attemptedIds.has(q.id))

        if (available.length === 0) {
          available = [...questions]
        }
      }
    }
  }

  // MCQs first, then shuffle within each group, then limit
  const mcqs = available.filter(q => q.type === 'mcq').sort(() => Math.random() - 0.5)
  const others = available.filter(q => q.type !== 'mcq').sort(() => Math.random() - 0.5)
  const shuffled = [...mcqs, ...others].slice(0, limit)

  // Fetch options for MCQ questions
  const mcqIds = shuffled.filter(q => q.type === 'mcq').map(q => q.id)
  const optionsMap: Record<string, { id: string; question_id: string; option_text: string; is_correct: boolean; display_order: number }[]> = {}

  if (mcqIds.length > 0) {
    const { data: options } = await supabase
      .from('mcq_options')
      .select('*')
      .in('question_id', mcqIds)
      .order('display_order')

    if (options) {
      for (const opt of options) {
        if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = []
        optionsMap[opt.question_id].push(opt)
      }
    }
  }

  const enriched: QuestionWithOptions[] = shuffled.map(q => ({
    ...q,
    options: optionsMap[q.id] ?? [],
    topic: topic, // We can attach the topic if it's for a single topic, or leave it null if mixed
  }))

  return NextResponse.json({ questions: enriched, topic })
}
