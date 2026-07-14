import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const totalAttempts = attempts?.length ?? 0
  const correctAttempts = attempts?.filter(a => a.is_correct).length ?? 0
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  // Calculate today's attempts
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayAttempts = attempts?.filter(a => new Date(a.created_at) >= today).length ?? 0

  // Topics with low accuracy (weak areas)
  const { data: progress } = await supabase
    .from('topic_progress')
    .select('accuracy, topics(name)')
    .eq('user_id', user.id)
    .not('accuracy', 'is', null)
    .order('accuracy', { ascending: true })
    .limit(3)

  const weakTopics = (progress ?? [])
    .filter(p => p.accuracy !== null && p.accuracy < 80)
    .map(p => ({ name: (p.topics as unknown as { name: string })?.name ?? 'Unknown', accuracy: p.accuracy }))

  const { data: topicProgress } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', user.id)

  const topicsPracticed = topicProgress?.length ?? 0
  const streakDays = calculateStreak(attempts ?? [])

  const xp = (totalAttempts * 10) + (correctAttempts * 5)

  return NextResponse.json({
    total_attempts: totalAttempts,
    correct_attempts: correctAttempts,
    accuracy,
    today_attempts: todayAttempts,
    topics_practiced: topicsPracticed,
    weak_topics: weakTopics,
    streak_days: streakDays,
    xp,
  })
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

  // Streak must include today or yesterday
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
