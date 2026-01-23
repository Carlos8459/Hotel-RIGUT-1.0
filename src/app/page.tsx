import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-background');

  return (
    <div className="min-h-screen bg-background antialiased">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="relative hidden items-center justify-center lg:flex">
          {loginImage && (
            <Image
              src={loginImage.imageUrl}
              alt={loginImage.description}
              fill
              className="object-cover"
              priority
              data-ai-hint={loginImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="font-headline text-4xl font-semibold tracking-tight text-secondary-foreground">
                Hotel RIGUT
              </h1>
              <p className="text-muted-foreground">
                Bienvenido de nuevo. Inicia sesión en tu cuenta.
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
