import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const questionId = searchParams.get('question_id')

  if (!questionId) {
    return NextResponse.json({ error: 'question_id is required' }, { status: 400 })
  }

  // Simulate AI generation delay
  await new Promise(resolve => setTimeout(resolve, 1200))

  const mockExplanation = `**Step-by-step breakdown:**\n\n1. First, identify the core principle tested in the question. Often, this relates to applying a standard formula or rule you've seen in the syllabus.\n2. Look at the incorrect options: they usually represent common student misconceptions (like mixing up signs or forgetting to divide by 2).\n3. To arrive at the correct answer, simply apply the formula step-by-step.\n\n*Tip: Always double-check your working in the margin!*`

  return NextResponse.json({ explanation: mockExplanation })
}
