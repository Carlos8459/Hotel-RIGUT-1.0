"use client";

import { LoginForm } from '@/components/auth/login-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
            <p>Cargando...</p>
        </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-login-gradient p-6">
      <div className="z-10 w-full max-w-sm space-y-16">
        <div className="text-center">
          <h1 className="font-headline text-5xl font-bold text-white">
            Hotel RIGUT
          </h1>
          <p className="mt-2 text-white/80">
            Bienvenido de nuevo. Inicia sesión en tu cuenta.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
