import { NextResponse } from 'next/server'
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository'
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repository = new SupabaseLearningRecordRepository(supabase)
    const records = await repository.findDueForReview(user.id, 50)

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Due records error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
