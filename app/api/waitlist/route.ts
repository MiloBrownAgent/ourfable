import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim(), source: source || 'landing' });

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation — email already exists
        return NextResponse.json({ message: 'You\'re already on the list!' }, { status: 200 });
      }
      console.error('Waitlist insert error:', error);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully joined the waitlist!' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
