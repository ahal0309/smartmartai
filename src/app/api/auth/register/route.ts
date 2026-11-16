import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limiter';
import { sanitizeString } from '@/lib/validation';

export async function POST(req: NextRequest) {
  // Apply aggressive rate limiting for registration attempts
  const clientIp = getClientIp(req);
  const rateLimitCheck = rateLimit(`register-${clientIp}`, 3, 3600000); // 3 attempts per hour
  if (!rateLimitCheck.success) {
    return rateLimitCheck.response!;
  }

  try {
    const rawData = await req.json();
    const email = sanitizeString(rawData.email || '');
    const password = rawData.password || '';
    const name = sanitizeString(rawData.name || '');
    const role = sanitizeString(rawData.role || 'customer');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Password strength checks (server-side)
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?"':{}|<>]/.test(password);
    if (!(hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial)) {
      return NextResponse.json({ error: 'Password is too weak. It must be at least 8 characters and include uppercase, lowercase, a number and a special character.' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, name, role });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


