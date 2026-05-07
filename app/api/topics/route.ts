import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { GetTopicsResponse, TopicWithProgress } from '@/types';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all topics
  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .order('priority', { ascending: true })
    .order('frequency', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If logged in, enrich with user's progress
  let progressMap: Record<string, { accuracy: number | null; last_practiced: string | null }> = {};

  if (user) {
    const { data: progress } = await supabase
      .from('topic_progress')
      .select('topic_id, accuracy, last_practiced')
      .eq('user_id', user.id);

    if (progress) {
      progressMap = Object.fromEntries(
        progress.map((p: any) => [p.topic_id, { accuracy: p.accuracy, last_practiced: p.last_practiced }])
      );
    }
  }

  const enriched: TopicWithProgress[] = (topics ?? []).map((t: any) => ({
    ...t,
    user_accuracy: progressMap[t.id]?.accuracy ?? null,
    last_practiced: progressMap[t.id]?.last_practiced ?? null,
  }));

  return NextResponse.json<GetTopicsResponse>({ topics: enriched });
}
