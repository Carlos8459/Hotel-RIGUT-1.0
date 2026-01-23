import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="font-headline text-3xl font-semibold text-secondary-foreground">Register</h1>
        <p className="text-muted-foreground">This page is under construction.</p>
        <Button asChild>
          <Link href="/">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}
