import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const daysAgo = new Date()
  daysAgo.setDate(daysAgo.getDate() - 90)
  daysAgo.setHours(0, 0, 0, 0)

  const { data: attempts } = await supabase
    .from('attempts')
    .select('created_at, is_correct')
    .eq('user_id', user.id)
    .gte('created_at', daysAgo.toISOString())

  const dayMap: Record<string, { total: number; correct: number }> = {}

  for (let i = 0; i < 91; i++) {
    const d = new Date(daysAgo)
    d.setDate(d.getDate() + i)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    dayMap[key] = { total: 0, correct: 0 }
  }

  for (const a of attempts ?? []) {
    const d = new Date(a.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (dayMap[key]) {
      dayMap[key].total++
      if (a.is_correct) dayMap[key].correct++
    }
  }

  const days = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  return NextResponse.json({ days })
}
