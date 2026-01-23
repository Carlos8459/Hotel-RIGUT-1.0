'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, KeyRound, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccountSettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    if (isUserLoading || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Configuración de la Cuenta</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Perfil</CardTitle>
                        <CardDescription>Estos son los detalles de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" defaultValue={user.email || ''} disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Seguridad</CardTitle>
                        <CardDescription>Cambia tu PIN y gestiona la seguridad de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button disabled>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Cambiar PIN (Próximamente)
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cerrar Sesión</CardTitle>
                        <CardDescription>Cierra la sesión en tu dispositivo actual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar sesión
                       </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
