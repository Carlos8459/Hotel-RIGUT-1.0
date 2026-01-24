'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Settings,
  BarChart2,
  Wrench,
  Receipt,
  UserCog,
  BookUser,
} from 'lucide-react';

export default function ToolsPage() {
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

    const isLoading = isUserLoading || isUserProfileLoading;

    if (isLoading || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Herramientas</h1>
            </header>

            <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/customers" className="block w-full">
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-col items-start gap-4 space-y-0 p-4">
                            <div className="flex items-center justify-center bg-primary/10 p-3 rounded-lg">
                                <BookUser className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Clientes</CardTitle>
                                <CardDescription>Busca y revisa el historial de visitas de tus clientes.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/expenses" className="block w-full">
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-col items-start gap-4 space-y-0 p-4">
                             <div className="flex items-center justify-center bg-primary/10 p-3 rounded-lg">
                                <Receipt className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Registro de Gastos</CardTitle>
                                <CardDescription>Lleva un control detallado de los gastos del hotel.</CardDescription>
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
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-primary bg-primary/10 rounded-lg px-2 py-1">
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
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <Settings className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Ajustes</span>
                        </Button>
                    </Link>
                </div>
            </footer>
        </div>
    );
}
