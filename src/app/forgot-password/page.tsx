"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="z-10 w-full max-w-sm space-y-8">
            <div className="text-center">
                <h1 className="font-headline text-4xl font-bold text-foreground">
                    Recuperar PIN
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Esta función estará disponible próximamente. Póngase en contacto con el administrador para obtener ayuda.
                </p>
            </div>

            <div className="mt-6 text-center">
                <Button asChild>
                    <Link href="/">
                        Volver a inicio de sesión
                    </Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
