'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function RoomSettingsPage() {
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
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Configuración del Hotel</h1>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Precios de Habitaciones</CardTitle>
                        <CardDescription>Ajusta los precios base para cada tipo de habitación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price-unipersonal">Unipersonal</Label>
                                <Input id="price-unipersonal" type="number" defaultValue="400" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price-matrimonial">Matrimonial</Label>
                                <Input id="price-matrimonial" type="number" defaultValue="500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price-unipersonal-ac">Unipersonal con A/C</Label>
                                <Input id="price-unipersonal-ac" type="number" defaultValue="700" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="price-matrimonial-ac">Matrimonial con A/C</Label>
                                <Input id="price-matrimonial-ac" type="number" defaultValue="800" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Configuración General</CardTitle>
                        <CardDescription>Opciones generales para la gestión del hotel.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                                <span>Modo oscuro automático</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Activar el modo oscuro según la configuración del sistema.
                                </span>
                            </Label>
                            <Switch id="dark-mode" defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="notifications" className="flex flex-col space-y-1">
                                <span>Notificar nuevas reservas</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                   Recibe una notificación cuando se cree una nueva reserva.
                                </span>
                            </Label>
                            <Switch id="notifications" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>

            </main>
        </div>
    );
}
