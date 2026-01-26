'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutGrid, Calendar as CalendarIcon, Users, Settings, Wrench, User as UserIcon, BarChart2, Bell, Shield } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';


export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{role: 'Admin' | 'Socio'}>(userDocRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);


    if (isUserLoading || !user || isUserProfileLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-12 sm:p-6 lg:p-8 pb-24">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Ajustes</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-4">
                <Link href="/settings/rooms" className="block w-full">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Settings className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg">Habitaciones y Consumos</CardTitle>
                                <CardDescription>Administra las habitaciones y los productos de consumo extra.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/settings/account" className="block w-full">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                         <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                             <UserIcon className="h-6 w-6 text-muted-foreground" />
                             <div>
                                <CardTitle className="text-lg">Cuenta</CardTitle>
                                <CardDescription>Gestiona los detalles de tu cuenta y la seguridad.</CardDescription>
                             </div>
                        </CardHeader>
                    </Card>
                </Link>

                 <Link href="/settings/notifications" className="block w-full">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Bell className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg">Notificaciones</CardTitle>
                                <CardDescription>Configura cuándo y cómo recibir notificaciones.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                
                <Link href="/whatsapp" className="block w-full">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <WhatsAppIcon className="h-6 w-6" />
                            <div>
                                <CardTitle className="text-lg">Automatización de WhatsApp</CardTitle>
                                <CardDescription>Configura el envío de mensajes a clientes.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                
                {userProfile?.role === 'Admin' && (
                    <Link href="/admin/management" className="block w-full">
                        <Card className="hover:border-primary transition-colors cursor-pointer border-destructive/50">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <Shield className="h-6 w-6 text-destructive" />
                                <div>
                                    <CardTitle className="text-lg text-destructive">Acceso a Administración</CardTitle>
                                    <CardDescription>Modifica o elimina registros de clientes y finanzas.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                )}

            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-background/50 border-t border-border p-2 z-10 backdrop-blur-sm md:hidden">
                <div className="flex justify-around">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <LayoutGrid className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Habitaciones</span>
                        </Button>
                    </Link>
                    <Link href="/reservations">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <CalendarIcon className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Reservas</span>
                        </Button>
                    </Link>
                    <Link href="/tools">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <Wrench className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Herramientas</span>
                        </Button>
                    </Link>
                    <Link href="/stats">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <BarChart2 className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Estadísticas</span>
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-primary bg-primary/10 rounded-lg px-2 py-1">
                            <Settings className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Ajustes</span>
                        </Button>
                    </Link>
                </div>
            </footer>
        </div>
    );
}
