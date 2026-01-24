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

import type { Reservation, WhatsappConfig } from '@/lib/types';


const WhatsAppIcon = (props) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    className={props.className}
    fill="currentColor"
  >
    <title>WhatsApp</title>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.46 3.48 1.34 4.94l-1.48 5.45 5.58-1.45c1.41.83 3.02 1.26 4.7 1.26h.01c5.46 0 9.9-4.45 9.9-9.91s-4.45-9.9-9.91-9.9zM12.04 21.9c-1.61 0-3.14-.42-4.46-1.21l-.32-.19-3.31.87.89-3.23-.21-.33c-.88-1.4-1.34-3.04-1.34-4.79 0-4.43 3.6-8.03 8.04-8.03s8.04 3.6 8.04 8.03-3.6 8.03-8.04 8.03zm4.83-5.99c-.28-.14-1.65-.81-1.9-.91-.26-.1-.45-.14-.64.14-.19.28-.72.91-.88 1.1-.16.19-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.39-1.02-.91-1.71-2.04-1.92-2.39-.21-.35-.02-.54.12-.68.13-.13.28-.33.42-.51.14-.17.19-.28.28-.47.1-.19.05-.38-.02-.51-.07-.14-.64-1.54-.88-2.1-.24-.56-.48-.48-.64-.48-.17,0-.35-.03-.54-.03-.19,0-.51.08-.77.35-.26.28-.99 1.02-1.2 1.25-.21.23-.42.54-.42.92s.43 1.57.48 1.69c.05.12.99 1.63 2.4 2.26.33.15.59.24.79.3.3.08.58.07.79-.04.25-.13.72-.29.82-.58.1-.28.1-.54.07-.68-.03-.14-.12-.21-.26-.35z" />
  </svg>
);


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
      <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div className="flex-grow flex items-center gap-3">
                    <WhatsAppIcon className="h-7 w-7 text-green-500" />
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
