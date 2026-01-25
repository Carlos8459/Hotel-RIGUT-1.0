'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { subDays, isSameDay, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Send, Settings, Bot } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';

import type { Reservation, WhatsappConfig } from '@/lib/types';


export default function WhatsappAutomationPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data fetching
    const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{role: 'Admin' | 'Socio'}>(userDocRef);
    
    const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);
    const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);
    
    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'whatsapp_config') : null, [firestore]);
    const { data: whatsappConfigData, isLoading: configLoading, error: configError } = useDoc<Omit<WhatsappConfig, 'id'>>(settingsDocRef);
    
    // State management
    const [messageTemplate, setMessageTemplate] = useState('');
    const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
        if (!isUserProfileLoading && userProfile && userProfile.role !== 'Admin') {
            toast({
                title: "Acceso Denegado",
                description: "No tienes permiso para acceder a esta página.",
                variant: "destructive",
            });
            router.push('/dashboard');
        }
    }, [user, isUserLoading, userProfile, isUserProfileLoading, router, toast]);

    useEffect(() => {
        if (whatsappConfigData) {
            setMessageTemplate(whatsappConfigData.messageTemplate || '');
            setIsAutomationEnabled(whatsappConfigData.isEnabled || false);
        } else if (!configLoading) {
            // Set a default template if none exists
            const defaultTemplate = `¡Hola, {guestName}! 👋 Gracias por hospedarte en {hotelName}. Esperamos que hayas tenido una excelente estadía. Nos encantaría saber tu opinión para seguir mejorando. ¡Vuelve pronto!`;
            setMessageTemplate(defaultTemplate);
        }
    }, [whatsappConfigData, configLoading]);
    
    const pendingCustomers = useMemo(() => {
        if (!reservationsData) return [];

        const yesterday = subDays(new Date(), 1);
        const customers = reservationsData
            .filter(res => {
                const checkOutDate = parseISO(res.checkOutDate);
                return isSameDay(checkOutDate, yesterday) && res.status === 'Checked-Out' && res.phone;
            })
            .map(res => ({
                guestName: res.guestName,
                phone: res.phone!,
                checkOutDate: res.checkOutDate
            }));

        return customers;
    }, [reservationsData]);

    const handleSaveSettings = () => {
        if (!firestore || !settingsDocRef) return;
        setIsSaving(true);
        const newConfig = {
            messageTemplate,
            isEnabled: isAutomationEnabled,
        };

        setDocumentNonBlocking(settingsDocRef, newConfig, { merge: true });

        toast({
            title: 'Ajustes guardados',
            description: 'Tu configuración de WhatsApp ha sido actualizada.',
        });
        setIsSaving(false);
    };

    const handleSendMessage = (phone: string, guestName: string) => {
        const hotelName = "Hotel RIGUT";
        const message = messageTemplate
            .replace(/{guestName}/g, guestName)
            .replace(/{hotelName}/g, hotelName);
        
        const encodedMessage = encodeURIComponent(message);
        // Note: The country code is hardcoded. This should be made configurable in a real app.
        const countryCode = '505'; 
        const whatsappUrl = `https://wa.me/${countryCode}${phone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const isLoading = isUserLoading || isUserProfileLoading || reservationsLoading || configLoading;

    if (isLoading) {
         return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando y verificando permisos...</p>
            </div>
        );
    }

    if (!user || !userProfile || userProfile.role !== 'Admin') {
        return null;
    }
    
    return (
      <div className="dark min-h-screen bg-background text-foreground p-4 pt-12 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div className="flex-grow flex items-center gap-3">
                    <WhatsAppIcon className="h-7 w-7" />
                    <h1 className="text-2xl font-bold">Automatización de WhatsApp</h1>
                </div>
            </header>
            
            <main className="max-w-3xl mx-auto space-y-8">
                 {configError && <p className="text-destructive">Error al cargar la configuración: {configError.message}</p>}
                <Card>
                    <CardHeader>
                        <CardTitle>Mensajes Pendientes</CardTitle>
                        <CardDescription>
                            Clientes que hicieron check-out ayer y están listos para recibir el mensaje.
                            {isAutomationEnabled && " La automatización los enviará por ti."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reservationsLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : pendingCustomers.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {pendingCustomers.map((customer, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card/80">
                                        <div>
                                            <p className="font-semibold">{customer.guestName}</p>
                                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                        </div>
                                        <Button size="sm" onClick={() => handleSendMessage(customer.phone, customer.guestName)}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Enviar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-10 px-4 border border-dashed rounded-lg">
                                <p>No hay mensajes pendientes de ayer.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Mensaje Predeterminado</CardTitle>
                        <CardDescription>
                            Edita el mensaje que se enviará. Puedes usar {'`{guestName}`'} y {'`{hotelName}`'}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {configLoading ? <Skeleton className="h-32 w-full" /> : (
                            <Textarea
                                value={messageTemplate}
                                onChange={(e) => setMessageTemplate(e.target.value)}
                                className="min-h-[150px]"
                                placeholder="Escribe tu mensaje aquí..."
                            />
                         )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Automatización</CardTitle>
                        <CardDescription>
                            Activa el envío automático de mensajes un día después del check-out del cliente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {configLoading ? <Skeleton className="h-10 w-full" /> : (
                            <div className="flex items-center space-x-4 rounded-md border p-4">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {isAutomationEnabled ? 'Automatización Activada' : 'Automatización Desactivada'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Controla el envío automático de mensajes.
                                    </p>
                                </div>
                                <Switch
                                    checked={isAutomationEnabled}
                                    onCheckedChange={setIsAutomationEnabled}
                                />
                            </div>
                         )}
                    </CardContent>
                     <CardFooter>
                        <Button onClick={handleSaveSettings} disabled={isSaving || configLoading}>
                            <Settings className="mr-2 h-4 w-4" />
                            {isSaving ? 'Guardando...' : 'Guardar Ajustes'}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
      </div>
    );
}

    