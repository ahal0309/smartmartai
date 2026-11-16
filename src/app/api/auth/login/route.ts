import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limiter';
import { sanitizeString } from '@/lib/validation';

export async function POST(req: NextRequest) {
  // Apply aggressive rate limiting for login attempts
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`login-${clientIp}`, 5, 60000); // 5 attempts per minute
  if (!rateLimitCheck.success) {
    return rateLimitCheck.response!;
  }

  try {
    const rawData = await req.json();
    const email = sanitizeString(rawData.email || '');
    const password = rawData.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

  // Return user info including role for dashboard redirect
  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, role: user.role });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


