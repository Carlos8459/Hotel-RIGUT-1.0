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
      fill="currentColor"
    >
      <title>WhatsApp</title>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.46 3.48 1.34 4.94l-1.48 5.45 5.58-1.45c1.41.83 3.02 1.26 4.7 1.26h.01c5.46 0 9.9-4.45 9.9-9.91s-4.45-9.9-9.91-9.9zM12.04 21.9c-1.61 0-3.14-.42-4.46-1.21l-.32-.19-3.31.87.89-3.23-.21-.33c-.88-1.4-1.34-3.04-1.34-4.79 0-4.43 3.6-8.03 8.04-8.03s8.04 3.6 8.04 8.03-3.6 8.03-8.04 8.03zm4.83-5.99c-.28-.14-1.65-.81-1.9-.91-.26-.1-.45-.14-.64.14-.19.28-.72.91-.88 1.1-.16.19-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.39-1.02-.91-1.71-2.04-1.92-2.39-.21-.35-.02-.54.12-.68.13-.13.28-.33.42-.51.14-.17.19-.28.28-.47.1-.19.05-.38-.02-.51-.07-.14-.64-1.54-.88-2.1-.24-.56-.48-.48-.64-.48-.17,0-.35-.03-.54-.03-.19,0-.51.08-.77.35-.26.28-.99 1.02-1.2 1.25-.21.23-.42.54-.42.92s.43 1.57.48 1.69c.05.12.99 1.63 2.4 2.26.33.15.59.24.79.3.3.08.58.07.79-.04.25-.13.72-.29.82-.58.1-.28.1-.54.07-.68-.03-.14-.12-.21-.26-.35z" />
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
                            <WhatsAppIcon className="h-6 w-6 text-green-500" />
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
