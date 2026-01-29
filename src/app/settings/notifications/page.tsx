'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Bell, BellOff, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationConfig } from '@/lib/types';


export default function NotificationSettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    // User profile for role check
    const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{role: 'Admin' | 'Socio'}>(userDocRef);

    // Settings doc
    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'notification_config') : null, [firestore]);
    const { data: settingsData, isLoading: settingsLoading } = useDoc<NotificationConfig>(settingsDocRef);
    
    // Local state for settings
    const [settings, setSettings] = useState<Omit<NotificationConfig, 'id'>>({
        isEnabled: true,
        onNewReservation: true,
        onCheckOut: true,
        onNewExpense: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (!isUserLoading && !user) router.push('/');
        if (!isUserProfileLoading && userProfile && userProfile.role !== 'Admin') {
            toast({ title: "Acceso Denegado", description: "No tienes permiso para acceder a esta página.", variant: "destructive" });
            router.push('/dashboard');
        }
    }, [user, isUserLoading, userProfile, isUserProfileLoading, router, toast]);

    useEffect(() => {
        if (settingsData) {
            setSettings({
                isEnabled: settingsData.isEnabled ?? true,
                onNewReservation: settingsData.onNewReservation ?? true,
                onCheckOut: settingsData.onCheckOut ?? true,
                onNewExpense: settingsData.onNewExpense ?? true,
            });
        }
    }, [settingsData]);

    const handleSave = () => {
        if (!firestore || !settingsDocRef) return;
        setIsSaving(true);
        setDocumentNonBlocking(settingsDocRef, settings, { merge: true });
        toast({ title: 'Ajustes guardados', description: 'Tu configuración de notificaciones ha sido actualizada.' });
        setIsSaving(false);
    };

    const handleRequestPushPermission = async () => {
        toast({
            title: "Solicitando permiso...",
            description: "Por favor, acepta la solicitud en tu navegador para recibir notificaciones.",
        });

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted.');
                
                // --- PASO IMPORTANTE ---
                // Reemplaza la siguiente línea con tu clave VAPID de Firebase.
                // La encuentras en: Proyecto > Engranaje (Ajustes) > Configuración del proyecto > Cloud Messaging > Credenciales de notificaciones push web.
                const VAPID_KEY = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE';

                const messaging = getMessaging(getApp());
                const token = await getToken(messaging, { vapidKey: VAPID_KEY });
                
                if (token) {
                    console.log('FCM Token:', token);
                    // Aquí guardarías el token en la base de datos asociado al usuario.
                    // Por ejemplo: updateDocumentNonBlocking(userDocRef, { fcmTokens: arrayUnion(token) });
                    toast({
                        title: '¡Notificaciones Activadas!',
                        description: 'Recibirás notificaciones push en este dispositivo.',
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'No se pudo obtener el token',
                        description: 'Asegúrate de que la clave VAPID sea correcta y no haya conflictos con otros service workers.',
                    });
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Permiso Denegado',
                    description: 'No se podrán enviar notificaciones si no aceptas el permiso.',
                });
            }
        } catch (error) {
            console.error('An error occurred while getting the token: ', error);
            toast({
                variant: 'destructive',
                title: 'Error de Configuración',
                description: 'Ocurrió un error. Revisa la consola y asegúrate de que tu clave VAPID es correcta.',
            });
        }
    };

    const isLoading = isUserLoading || isUserProfileLoading || settingsLoading;

    if (isLoading) {
        return (
            <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
                <header className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-7 w-64" />
                </header>
                <main className="max-w-2xl mx-auto space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        );
    }
    
    if (!user || (userProfile && userProfile.role !== 'Admin')) {
        return null; // Redirects are handled in the useEffect
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Ajustes de Notificaciones</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones en la App</CardTitle>
                        <CardDescription>Activa o desactiva todas las notificaciones dentro de la aplicación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">
                                    {settings.isEnabled ? <Bell className="mr-2 h-4 w-4 text-primary" /> : <BellOff className="mr-2 h-4 w-4 text-muted-foreground" />}
                                    {settings.isEnabled ? 'Notificaciones Activadas' : 'Notificaciones Desactivadas'}
                                </p>
                            </div>
                            <Switch
                                checked={settings.isEnabled}
                                onCheckedChange={(checked) => setSettings(s => ({ ...s, isEnabled: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tipos de Notificaciones en la App</CardTitle>
                        <CardDescription>Elige qué tipo de actividad genera una notificación dentro de la app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="new-reservation" 
                                checked={settings.onNewReservation}
                                onCheckedChange={(checked) => setSettings(s => ({ ...s, onNewReservation: !!checked }))}
                                disabled={!settings.isEnabled}
                            />
                            <Label htmlFor="new-reservation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nuevo check-in o reserva
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="check-out"
                                checked={settings.onCheckOut}
                                onCheckedChange={(checked) => setSettings(s => ({ ...s, onCheckOut: !!checked }))}
                                disabled={!settings.isEnabled}
                            />
                            <Label htmlFor="check-out" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Check-out de huésped
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="new-expense"
                                checked={settings.onNewExpense}
                                onCheckedChange={(checked) => setSettings(s => ({ ...s, onNewExpense: !!checked }))}
                                disabled={!settings.isEnabled}
                            />
                            <Label htmlFor="new-expense" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nuevo gasto registrado
                            </Label>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </CardFooter>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones Push</CardTitle>
                        <CardDescription>
                            Recibe notificaciones directamente en tu dispositivo, incluso cuando la aplicación está cerrada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleRequestPushPermission}>
                            Activar en este dispositivo
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
