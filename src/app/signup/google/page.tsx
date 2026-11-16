"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GoogleSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold mb-4">Continue with Google</h1>
        <p className="text-sm text-muted-foreground mb-6">We'll use your Google account to create or sign in to your Smart Mart account.</p>
        <div className="grid gap-4">
          <a href="/api/auth/google/start">
            <Button className="w-full">Continue with Google</Button>
          </a>
          <Link href="/signup">
            <Button variant="ghost" className="w-full">Back</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
