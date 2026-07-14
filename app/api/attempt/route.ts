import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { PostAttemptRequest, PostAttemptResponse } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: PostAttemptRequest = await request.json();
  const { question_id, is_correct } = body;

  if (!question_id || typeof is_correct !== 'boolean') {
    return NextResponse.json({ error: 'question_id and is_correct are required' }, { status: 400 });
  }

  // 1. Record the attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .insert({ user_id: user.id, question_id, is_correct })
    .select()
    .single();

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  // 2. Find the topic for this question
  const { data: question } = await supabase
    .from('questions')
    .select('topic_id')
    .eq('id', question_id)
    .single();

  if (!question?.topic_id) {
    // Question has no topic — still return the attempt
    return NextResponse.json({ attempt, topic_progress: null });
  }

  const topic_id = question.topic_id;

  // 3. Recalculate accuracy from all attempts on this topic's questions
  const { data: allAttempts } = await supabase
    .from('attempts')
    .select('is_correct, questions!inner(topic_id)')
    .eq('user_id', user.id)
    .eq('questions.topic_id', topic_id);

  const total   = allAttempts?.length ?? 0;
  const correct = allAttempts?.filter((a: { is_correct: boolean }) => a.is_correct).length ?? 0;
  const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : null;

  // 4. Upsert topic_progress
  const { data: topic_progress, error: progressError } = await supabase
    .from('topic_progress')
    .upsert(
      {
        user_id:        user.id,
        topic_id,
        accuracy,
        last_practiced: new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      },
      { onConflict: 'user_id,topic_id' }
    )
    .select()
    .single();

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  return NextResponse.json<PostAttemptResponse>({ attempt, topic_progress });
}
