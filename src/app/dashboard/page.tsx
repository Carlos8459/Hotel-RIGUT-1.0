import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-headline text-4xl font-semibold text-secondary-foreground">¡Bienvenido!</h1>
        <p className="text-muted-foreground">Has iniciado sesión correctamente.</p>
        <p className="text-lg">Panel de control en construcción.</p>
        <Button asChild variant="outline">
          <Link href="/">Cerrar sesión</Link>
        </Button>
      </div>
    </div>
  );
}
