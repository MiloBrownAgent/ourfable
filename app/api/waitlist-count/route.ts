import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ count: 0 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.log('Supabase count error:', error.message)
    return NextResponse.json({ count: 0 })
  }

  return NextResponse.json({ count: count || 0 })
}
