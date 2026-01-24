'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Users,
  Settings,
  BarChart2,
  Wrench,
  ChevronRight,
} from 'lucide-react';

export default function ToolsPage() {
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
                <h1 className="text-2xl font-bold">Herramientas</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-4">
                <Link href="/customers" className="block w-full">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-4">
                            <div className="flex items-center gap-4">
                                <Users className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-lg">Clientes</CardTitle>
                                    <CardDescription>Ver y gestionar el historial de clientes.</CardDescription>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                    </Card>
                </Link>

                {/* Future tools can be added here */}

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
