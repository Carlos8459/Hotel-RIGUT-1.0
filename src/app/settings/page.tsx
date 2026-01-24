'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutGrid, Calendar as CalendarIcon, Users, Settings, Wrench, User as UserIcon, BarChart2, Bell } from 'lucide-react';

const WhatsAppIcon = (props) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>WhatsApp</title>
      <path fillRule="evenodd" clipRule="evenodd" d="M18.4,5.6c-1.9-1.9-4.4-2.9-7.1-2.9c-5.5,0-9.9,4.4-9.9,9.9c0,1.8,0.5,3.5,1.3,5l-1.5,5.4l5.5-1.4c1.4,0.8,3,1.3,4.7,1.3h0c5.5,0,9.9-4.4,9.9-9.9C21.3,10,20.3,7.5,18.4,5.6z" fill="#25D366"/>
      <path d="M15.1,12.5l-0.9-0.4c-0.2-0.1-0.3-0.1-0.5,0.1l-0.7,0.8c-0.2,0.2-0.3,0.3-0.5,0.2c-0.8-0.3-1.8-0.7-2.9-1.6 c-1-0.8-1.7-1.7-2.1-2.4c-0.1-0.2-0.1-0.3,0-0.5l0.6-0.7c0.2-0.2,0.1-0.4,0-0.5L9.3,8.9C9.2,8.7,9.1,8.7,9,8.7c-0.1,0-0.3,0-0.4,0 l-1,0.1c-0.2,0-0.4,0.1-0.5,0.2c-0.7,0.5-1.1,1.1-1.1,2.1c0,0.2,0,0.5,0.1,0.8c0.1,0.3,0.4,0.9,1,1.8c0.8,1.2,1.9,2.4,3.2,3.5 c1.7,1.4,3.2,2.2,4.9,2.9c0.4,0.2,0.8,0.3,1.2,0.3c0.5,0,1-0.1,1.4-0.4c0.7-0.5,1.2-1.3,1.4-2.3c0.1-0.3,0.1-0.7,0.1-1 c0-0.1,0-0.2,0-0.2c0-0.2-0.1-0.4-0.2-0.5c-0.1-0.1-0.3-0.2-0.5-0.2L15.1,12.5z" fill="#FFFFFF"/>
    </svg>
);

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);


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
