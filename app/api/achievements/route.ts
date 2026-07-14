import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  current: number
  target: number
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: attempts } = await supabase
    .from('attempts')
    .select('is_correct, created_at')
    .eq('user_id', user.id)

  const { data: progress } = await supabase
    .from('topic_progress')
    .select('accuracy, topics(name, subject)')
    .eq('user_id', user.id)

  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, subject')

  const totalAttempts = attempts?.length ?? 0
  const correctAttempts = attempts?.filter(a => a.is_correct).length ?? 0
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  const streakDays = calculateStreak(attempts ?? [])

  const masteredTopics = (progress ?? []).filter(p => p.accuracy !== null && p.accuracy >= 80)

  const subjectsPracticed = new Set(
    (progress ?? [])
      .map(p => (p.topics as unknown as { subject: string })?.subject)
      .filter(Boolean)
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayAttempts = attempts?.filter(a => new Date(a.created_at) >= today).length ?? 0

  const topicsWithAttempts = new Set(
    (attempts ?? [])
      .filter(a => a.is_correct !== null)
      .map(() => '')
  )

  const attemptedTopicIds = new Set(
    (progress ?? []).map(p => (p.topics as unknown as { name: string })?.name)
  )

  const achievements: Achievement[] = [
    {
      id: 'first_question',
      title: 'First Steps',
      description: 'Answer your first question',
      icon: 'star',
      unlocked: totalAttempts >= 1,
      progress: Math.min(100, (totalAttempts / 1) * 100),
      current: totalAttempts,
      target: 1,
    },
    {
      id: 'ten_questions',
      title: 'Getting Started',
      description: 'Answer 10 questions',
      icon: 'books',
      unlocked: totalAttempts >= 10,
      progress: Math.min(100, (totalAttempts / 10) * 100),
      current: totalAttempts,
      target: 10,
    },
    {
      id: 'hundred_questions',
      title: 'Dedicated',
      description: 'Answer 100 questions',
      icon: 'target',
      unlocked: totalAttempts >= 100,
      progress: Math.min(100, (totalAttempts / 100) * 100),
      current: totalAttempts,
      target: 100,
    },
    {
      id: 'thousand_questions',
      title: 'The 1000 Club',
      description: 'Answer 1000 questions',
      icon: 'crown',
      unlocked: totalAttempts >= 1000,
      progress: Math.min(100, (totalAttempts / 1000) * 100),
      current: totalAttempts,
      target: 1000,
    },
    {
      id: 'seven_day_streak',
      title: 'On a Roll',
      description: 'Maintain a 7-day streak',
      icon: 'fire',
      unlocked: streakDays >= 7,
      progress: Math.min(100, (streakDays / 7) * 100),
      current: streakDays,
      target: 7,
    },
    {
      id: 'fourteen_day_streak',
      title: 'Unstoppable',
      description: 'Maintain a 14-day streak',
      icon: 'muscle',
      unlocked: streakDays >= 14,
      progress: Math.min(100, (streakDays / 14) * 100),
      current: streakDays,
      target: 14,
    },
    {
      id: 'thirty_day_streak',
      title: 'Legend',
      description: 'Maintain a 30-day streak',
      icon: 'trophy',
      unlocked: streakDays >= 30,
      progress: Math.min(100, (streakDays / 30) * 100),
      current: streakDays,
      target: 30,
    },
    {
      id: 'first_mastery',
      title: 'Focused',
      description: 'Master 1 topic (80%+ accuracy)',
      icon: 'check',
      unlocked: masteredTopics.length >= 1,
      progress: Math.min(100, (masteredTopics.length / 1) * 100),
      current: masteredTopics.length,
      target: 1,
    },
    {
      id: 'five_mastered',
      title: 'Scholar',
      description: 'Master 5 topics (80%+ accuracy)',
      icon: 'graduation',
      unlocked: masteredTopics.length >= 5,
      progress: Math.min(100, (masteredTopics.length / 5) * 100),
      current: masteredTopics.length,
      target: 5,
    },
    {
      id: 'polymath',
      title: 'Polymath',
      description: 'Practice in all 4 subjects',
      icon: 'globe',
      unlocked: subjectsPracticed.size >= 4,
      progress: Math.min(100, (subjectsPracticed.size / 4) * 100),
      current: subjectsPracticed.size,
      target: 4,
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Answer 20 questions in a single day',
      icon: 'zap',
      unlocked: todayAttempts >= 20,
      progress: Math.min(100, (todayAttempts / 20) * 100),
      current: todayAttempts,
      target: 20,
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Achieve 90%+ overall accuracy',
      icon: 'sparkle',
      unlocked: totalAttempts >= 20 && accuracy >= 90,
      progress: totalAttempts >= 20 ? Math.min(100, (accuracy / 90) * 100) : 0,
      current: accuracy,
      target: 90,
    },
    {
      id: 'explorer',
      title: 'Explorer',
      description: 'Practice every topic',
      icon: 'map',
      unlocked: topics ? attemptedTopicIds.size >= topics.length : false,
      progress: Math.min(100, (attemptedTopicIds.size / (topics?.length ?? 1)) * 100),
      current: attemptedTopicIds.size,
      target: topics?.length ?? 0,
    },
  ]

  return NextResponse.json({ achievements })
}

function calculateStreak(attempts: { created_at: string }[]): number {
  if (attempts.length === 0) return 0

  const dates = [...new Set(attempts.map(a => {
    const d = new Date(a.created_at)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))].sort()

  if (dates.length === 0) return 0

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`

  if (dates[dates.length - 1] !== todayStr && dates[dates.length - 1] !== yesterdayStr) {
    return 0
  }

  let streak = 1
  for (let i = dates.length - 2; i >= 0; i--) {
    const curr = new Date(dates[i])
    const next = new Date(dates[i + 1])
    const diff = (next.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) streak++
    else break
  }

  return streak
}
