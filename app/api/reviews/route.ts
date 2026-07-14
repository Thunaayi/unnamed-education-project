import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all incorrect attempts with their timestamps, joined with topic info
  const { data: wrongAttempts } = await supabase
    .from('attempts')
    .select('question_id, created_at, questions!inner(topic_id, topics!inner(name, subject))')
    .eq('user_id', user.id)
    .eq('is_correct', false)
    .order('created_at', { ascending: false })

  if (!wrongAttempts || wrongAttempts.length === 0) {
    return NextResponse.json({ reviews: [], total: 0 })
  }

  // Group by question, keep latest attempt per question
  const latestPerQuestion: Record<string, { created_at: string; topicName: string; subject: string }> = {}
  for (const a of wrongAttempts) {
    const qData = a.questions as unknown as { topic_id: string; topics: { name: string; subject: string } }
    if (!latestPerQuestion[a.question_id]) {
      latestPerQuestion[a.question_id] = {
        created_at: a.created_at,
        topicName: qData?.topics?.name ?? 'Unknown',
        subject: qData?.topics?.subject ?? 'General',
      }
    }
  }

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  // Due: questions answered wrong > 1 day ago (ready for review)
  const due = Object.entries(latestPerQuestion)
    .filter(([, v]) => now - new Date(v.created_at).getTime() > dayMs)
    .map(([questionId, v]) => ({
      question_id: questionId,
      topic: v.topicName,
      subject: v.subject,
      last_wrong: v.created_at,
    }))
    .slice(0, 10)

  return NextResponse.json({
    reviews: due,
    total: due.length,
  })
}
