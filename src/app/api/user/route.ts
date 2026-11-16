import { NextResponse } from 'next/server';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user || !('email' in session.user) || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: (session.user as any).email });
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Map DB -> profile response (with safe defaults)
    return NextResponse.json({
  name: (user as any).name || (session.user as any).name || '',
  email: (user as any).email,
  role: (user as any).role || 'customer',
      phone: (user as any).phone || '',
      avatarUrl: (user as any).avatarUrl || '/avatar.jpg',
      membership: (user as any).membership || '',
      loyaltyPercent: (user as any).loyaltyPercent || '75%',
      loyaltyPoints: (user as any).loyaltyPoints || '0 / 1000 Points',
      loyaltyTier: (user as any).loyaltyTier || 'Bronze',
      address: (user as any).address || '',
      cardLast4: (user as any).cardLast4 || '',
      cardExp: (user as any).cardExp || '',
      emailNotifications: (user as any).emailNotifications ?? true,
      pushNotifications: (user as any).pushNotifications ?? true,
    });
  } catch (e) {
    console.error('GET /api/user error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
