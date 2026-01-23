'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Calendar, Users, Settings, Wrench } from 'lucide-react';

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
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Ajustes</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración de Habitaciones</CardTitle>
                        <CardDescription>Administra los precios y otros detalles de las habitaciones.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button>
                           <Wrench className="mr-2 h-4 w-4" />
                           Habitaciones
                       </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Cuenta</CardTitle>
                         <CardDescription>Hola, {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button variant="destructive" onClick={handleLogout}>Cerrar sesión</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Próximamente</CardTitle>
                        <CardDescription>Más opciones de configuración estarán disponibles pronto.</CardDescription>
                    </CardHeader>
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
