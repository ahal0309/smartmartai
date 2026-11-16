import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

// Required env vars:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_BASE_URL

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return res.json();
}

async function fetchProfile(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/auth/google/callback`;
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const tokenResp = await exchangeCodeForTokens(code, redirectUri);
    const accessToken = tokenResp.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get access token', details: tokenResp }, { status: 400 });
    }

    const profile = await fetchProfile(accessToken);
    const email = profile.email;
    const name = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim();

    // Connect to DB and create or find user
    await connectToDatabase();
    let user = await User.findOne({ email }).lean();
    if (!user) {
      // Create a random password hash or leave passwordHash empty — for OAuth users we can set a placeholder.
      const randomHash = Math.random().toString(36).slice(2);
      user = await User.create({ email, name, passwordHash: randomHash });
    }

    // Here you would create a session or JWT and redirect the user to the app.
    // For now, redirect to /login with a query param indicating OAuth success.
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/login?oauth=google&email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
}
