import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';

export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background/80 to-transparent">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Smart Mart</h1>
        </Link>
    <div className="flex items-center gap-4">
      <Link href="/customer/shop">
        <Button variant="outline">🛒 Shop Now</Button>
      </Link>
      <Link href="/login">
        <Button variant="ghost">Login</Button>
      </Link>
      <Link href="/signup">
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Get Started</Button>
      </Link>
    </div>
      </div>
    </header>
  );
}
