import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-headline text-4xl font-semibold text-secondary-foreground">Welcome!</h1>
        <p className="text-muted-foreground">You have successfully logged in.</p>
        <p className="text-lg">Dashboard under construction.</p>
        <Button asChild variant="outline">
          <Link href="/">Log out</Link>
        </Button>
      </div>
    </div>
  );
}
