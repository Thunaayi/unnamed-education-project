import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { GetRecommendationsResponse, TopicWithProgress } from '@/types';

const PRIORITY_SCORE: Record<string, number> = { high: 3, medium: 2, low: 1 };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: topics, error } = await supabase
    .from('topics')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  // Score = priority weight × frequency, boosted if user accuracy is low
  const scored = enriched.map((t: any) => {
    const base = (PRIORITY_SCORE[t.priority] ?? 1) * t.frequency;
    // Boost topics where user performs poorly (lower accuracy → higher boost)
    const weaknessBoost = t.user_accuracy !== null ? (100 - t.user_accuracy) / 100 : 0.5;
    return { topic: t, score: base + base * weaknessBoost };
  });

  scored.sort((a, b) => b.score - a.score);

  const recommendations = scored.slice(0, 3).map((s: any) => s.topic);

  return NextResponse.json<GetRecommendationsResponse>({ recommendations });
}
