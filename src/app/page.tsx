"use client";

import { LoginForm } from '@/components/auth/login-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { HotelRigutLogo } from '@/components/ui/hotel-rigut-logo';


export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const loginBgImage = PlaceHolderImages.find(img => img.id === 'login-background');

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6">
       {loginBgImage && (
        <Image
          src={loginBgImage.imageUrl}
          alt={loginBgImage.description}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <HotelRigutLogo className="w-32 h-32 mx-auto" />
          <div>
            <h1 className="font-headline text-4xl font-bold text-white drop-shadow-md">
              Hotel RIGUT
            </h1>
            <p className="mt-2 text-white/80 drop-shadow-sm">
              Bienvenido de nuevo. Inicia sesión en tu cuenta.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
