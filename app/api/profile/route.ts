import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    email: user.email,
    display_name: profile?.display_name ?? '',
    created_at: user.created_at,
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { display_name } = body

  if (typeof display_name !== 'string') {
    return NextResponse.json({ error: 'display_name is required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('profiles')
      .update({ display_name, updated_at: new Date().toISOString() })
      .eq('id', user.id)
  } else {
    await supabase
      .from('profiles')
      .insert({ id: user.id, display_name })
  }

  return NextResponse.json({ display_name })
}
