import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .order('year', { ascending: false })

  const { data: questions } = await supabase
    .from('questions')
    .select('exam_id, type')

  const qMap: Record<string, { total: number; mcq: number; short: number; detailed: number }> = {}
  for (const q of questions ?? []) {
    if (!qMap[q.exam_id]) qMap[q.exam_id] = { total: 0, mcq: 0, short: 0, detailed: 0 }
    qMap[q.exam_id].total++
    if (q.type === 'mcq') qMap[q.exam_id].mcq++
    else if (q.type === 'short_answer') qMap[q.exam_id].short++
    else if (q.type === 'detailed_answer') qMap[q.exam_id].detailed++
  }

  const enriched = (exams ?? []).map(exam => ({
    ...exam,
    question_count: qMap[exam.id] ?? { total: 0, mcq: 0, short: 0, detailed: 0 },
  }))

  return NextResponse.json({ exams: enriched })
}
