"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    // final client-side check before submit
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?"':{}|<>]/.test(password);
    if (!(hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial)) {
      setError('Password is too weak. It must be at least 8 characters and include uppercase, lowercase, a number and a special character.');
      setLoading(false);
      return;
    }

    try {
        const name = `${firstName} ${lastName}`.trim();
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Registration failed');
      } else {
        setSuccess('Account created successfully. Please sign in.');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const pwdChecks = {
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?"':{}|<>]/.test(password),
  };
  const satisfied = Object.values(pwdChecks).filter(Boolean).length;
  const strengthLabel = satisfied <= 2 ? 'Weak' : satisfied === 3 || satisfied === 4 ? 'Medium' : 'Strong';

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-8 shadow-2xl">
        <div className="mx-auto w-full sm:w-[560px]">
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign up to get started with Smart Mart</p>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <div className="flex items-center gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input type="radio" name="role" value="customer" checked={role === 'customer'} onChange={() => setRole('customer')} className="mr-2" />
                  Customer
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="role" value="owner" checked={role === 'owner'} onChange={() => setRole('owner')} className="mr-2" />
                  Owner
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-describedby="pwd-help" />
              <div id="pwd-help" className="mt-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-2 ${strengthLabel === 'Weak' ? 'bg-red-500' : strengthLabel === 'Medium' ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${(satisfied / 5) * 100}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span className={pwdChecks.hasMinLength ? 'text-green-600' : 'text-red-600'}>Min 8 chars</span>
                  <span className={pwdChecks.hasUpper ? 'text-green-600' : 'text-red-600'}>Uppercase</span>
                  <span className={pwdChecks.hasLower ? 'text-green-600' : 'text-red-600'}>Lowercase</span>
                  <span className={pwdChecks.hasNumber ? 'text-green-600' : 'text-red-600'}>Number</span>
                  <span className={pwdChecks.hasSpecial ? 'text-green-600' : 'text-red-600'}>Special</span>
                </div>
                <div className="mt-1 text-xs">Strength: <strong>{strengthLabel}</strong></div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button type="submit" disabled={loading || !(pwdChecks.hasMinLength && pwdChecks.hasUpper && pwdChecks.hasLower && pwdChecks.hasNumber && pwdChecks.hasSpecial)} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-primary-foreground">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" type="button">
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" type="button">
                <Icons.facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
              <Button variant="outline" type="button">
                Twitter
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
