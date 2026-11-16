import Link from 'next/link';
import { Icons } from './icons';

export function AppFooter() {
  return (
    <footer className="relative z-10 bg-background border-t">
      <div className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
          <p>Copyright Smart Mart &copy; {new Date().getFullYear()}. All rights reserved.</p>
      </div>
    </footer>
  );
}
