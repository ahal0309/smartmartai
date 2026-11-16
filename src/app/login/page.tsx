"use client";
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Icons } from '@/components/icons';
import { Eye } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';

function LoginPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-illustration');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('Logged in successfully');
        // Fetch session and redirect
        const session = await getSession();
        
        // If there's a redirect parameter, use it
        if (redirect) {
          router.push(redirect);
        } else {
          // Otherwise redirect based on user role
          const role = (session?.user as any)?.role || 'customer';
          router.push(role === 'owner' ? '/owner/dashboard' : '/customer/dashboard');
        }

      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }

  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-card shadow-2xl md:grid-cols-2">
        <div className="relative flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-8">
          {loginImage ? (
            <Image
              src={loginImage.imageUrl}
              alt={loginImage.description}
              width={600}
              height={600}
              className="object-contain max-w-full h-auto"
              data-ai-hint={loginImage.imageHint}
              priority
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <Icons.shoppingCart className="h-24 w-24 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Smart Shopping</h3>
              <p className="text-muted-foreground">Your AI-powered shopping experience</p>
            </div>
          )}
        </div>
        <div className="p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-left">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">Sign in to continue shopping</p>
            </div>

            <div className="grid gap-6">
              <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type="password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                      <Eye className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember-me" />
                      <Label htmlFor="remember-me" className="text-sm font-normal">
                        Remember me
                      </Label>
                    </div>
                    <Link href="#" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600" role="alert">{error}</p>
                  )}
                  {success && (
                    <p className="text-sm text-green-600">{success}</p>
                  )}
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-primary-foreground hover:opacity-90 disabled:opacity-60">
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">
                  <Icons.google className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button variant="outline">
                  <Icons.facebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPageWithSuspense() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
