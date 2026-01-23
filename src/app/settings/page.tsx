'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Calendar, Users, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
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
        router.push('/'); // Force redirect to login page
    };

    if (isUserLoading || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Configuración</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                        <CardDescription>Administra los detalles de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Nombre de usuario</p>
                            <p className="text-sm text-muted-foreground">{user.displayName || user.email}</p>
                        </div>
                         <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Correo electrónico</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button variant="outline" className="mt-2">Cambiar PIN</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones</CardTitle>
                        <CardDescription>Elige cómo quieres recibir notificaciones.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications" className="flex-grow">Notificaciones por correo</Label>
                            <Switch id="email-notifications" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications" className="flex-grow">Notificaciones push</Label>
                            <Switch id="push-notifications" checked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Apariencia</CardTitle>
                        <CardDescription>Personaliza la apariencia de la aplicación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode" className="flex-grow">Modo oscuro</Label>
                            <Switch id="dark-mode" checked disabled />
                        </div>
                         <p className="text-sm text-muted-foreground">Más opciones de temas estarán disponibles próximamente.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Seguridad</CardTitle>
                        <CardDescription>Gestiona la seguridad de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button variant="destructive" onClick={handleLogout}>Cerrar sesión</Button>
                    </CardContent>
                </Card>

            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-10 md:hidden">
                <div className="flex justify-around">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <LayoutGrid className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Habitaciones</span>
                        </Button>
                    </Link>
                    <Link href="/reservations">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <Calendar className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Reservas</span>
                        </Button>
                    </Link>
                    <Link href="/customers">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <Users className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Clientes</span>
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-primary px-2 py-1">
                            <Settings className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Ajustes</span>
                        </Button>
                    </Link>
                </div>
            </footer>
        </div>
    );
}
