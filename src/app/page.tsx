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
      
      <div className="absolute top-[15%] left-[10%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rotate-12 transform rounded-[3rem] bg-primary/20 opacity-50 blur-2xl" />
      <div className="absolute bottom-[15%] right-[10%] h-56 w-56 translate-x-1/2 translate-y-1/2 rotate-12 transform rounded-[3rem] bg-accent/20 opacity-50 blur-2xl" />
      <div className="absolute top-[5%] right-[20%] h-24 w-24 rounded-full bg-primary/30 opacity-80 blur-lg" />
      <div className="absolute bottom-[10%] left-[20%] h-24 w-24 rounded-full bg-accent/30 opacity-80 blur-lg" />

      <div className="z-10 w-full max-w-sm space-y-16">
        <div className="text-center">
          <h1 className="font-headline text-5xl font-bold text-primary-foreground">
            Hotel RIGUT
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Bienvenido de nuevo. Inicia sesión en tu cuenta.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
