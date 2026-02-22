// app/api/user/consent/route.ts
// COPPA parental consent records — grant, check, and revoke consent

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const CURRENT_CONSENT_VERSION = '2026-02-19'; // matches privacy policy date

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET /api/user/consent — Check if the user has active consent on file
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('consent_records')
      .select('id, consent_type, consent_version, granted_at, revoked_at')
      .eq('user_id', user.id)
      .eq('consent_type', 'photo_collection_and_ai_processing')
      .is('revoked_at', null)
      .order('granted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      hasConsent: !!data,
      consent: data ?? null,
      currentVersion: CURRENT_CONSENT_VERSION,
      // Flag if they consented to an older policy version
      needsRenewal: data ? data.consent_version !== CURRENT_CONSENT_VERSION : false,
    });
  } catch (err) {
    console.error('GET /api/user/consent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/consent — Record parental consent
// Body: { consentType: string, acknowledged: boolean }
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { consentType = 'photo_collection_and_ai_processing', acknowledged } = body;

    if (!acknowledged) {
      return NextResponse.json(
        { error: 'Consent must be explicitly acknowledged' },
        { status: 400 }
      );
    }

    // Get IP and user agent for audit trail
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null;
    const userAgent = headersList.get('user-agent') || null;

    const supabase = await createClient();

    // Revoke any previous active consent of the same type first
    await supabase
      .from('consent_records')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('consent_type', consentType)
      .is('revoked_at', null);

    // Insert new consent record
    const { data, error } = await supabase
      .from('consent_records')
      .insert({
        user_id: user.id,
        consent_type: consentType,
        consent_version: CURRENT_CONSENT_VERSION,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id, consent_type, consent_version, granted_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, consent: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/user/consent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user/consent — Revoke consent (parent data rights)
export async function DELETE() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('consent_records')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('revoked_at', null);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Consent revoked. No further photos will be processed.' });
  } catch (err) {
    console.error('DELETE /api/user/consent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
