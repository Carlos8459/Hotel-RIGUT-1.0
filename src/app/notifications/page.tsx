'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notification, Reservation, Room } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Bell, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Home, User as UserIcon } from 'lucide-react';

function NotificationDetailModal({ notification, isOpen, onClose }: { notification: Notification, isOpen: boolean, onClose: () => void }) {
    const firestore = useFirestore();

    const reservationRef = useMemoFirebase(
        () => (firestore && notification.reservationId) ? doc(firestore, 'reservations', notification.reservationId) : null,
        [firestore, notification.reservationId]
    );
    const { data: reservation, isLoading: reservationLoading } = useDoc<Reservation>(reservationRef);

    const roomRef = useMemoFirebase(
        () => (firestore && notification.roomId) ? doc(firestore, 'rooms', notification.roomId) : null,
        [firestore, notification.roomId]
    );
    const { data: room, isLoading: roomLoading } = useDoc<Room>(roomRef);

    const isLoading = reservationLoading || roomLoading;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl">
                <DialogHeader>
                    <DialogTitle>Detalle de la Notificación</DialogTitle>
                    <DialogDescription className="pt-2">{notification.creatorName} {notification.message}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : (
                        <>
                            {reservation && (
                                <div className="p-3 border rounded-lg bg-background/50 space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2"><UserIcon className="h-4 w-4"/> Cliente</h4>
                                    <p className="pl-6">{reservation.guestName}</p>
                                    {reservation.cedula && <p className="text-sm text-foreground pl-6">{reservation.cedula}</p>}
                                </div>
                            )}
                            {room && (
                                <div className="p-3 border rounded-lg bg-background/50 space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2"><Home className="h-4 w-4"/> Habitación</h4>
                                    <p className="pl-6">{room.title}</p>
                                    <p className="text-sm text-muted-foreground pl-6">{room.type}</p>
                                </div>
                            )}
                            {!reservation && !room && (
                                <p className="text-muted-foreground text-sm text-center py-4">No hay detalles adicionales para esta notificación.</p>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}


export default function NotificationsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const notificationsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc')) : null),
        [firestore]
    );
    const { data: notifications, isLoading: notificationsLoading } = useCollection<Omit<Notification, 'id'>>(notificationsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const getCardClass = (type?: 'info' | 'warning' | 'alert') => {
        switch(type) {
            case 'warning':
                return 'bg-amber-500/10 border-amber-500/50';
            case 'alert':
                return 'bg-destructive/10 border-destructive/50';
            default:
                return 'bg-card';
        }
    }

    if (isUserLoading || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }
    
    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div className="flex-grow">
                    <h1 className="text-2xl font-bold">Notificaciones</h1>
                    <p className="text-muted-foreground">Actividad reciente de tus socios.</p>
                </div>
            </header>

            <main className="max-w-2xl mx-auto">
                <div className="space-y-4">
                    {notificationsLoading && (
                        [...Array(5)].map((_, i) => (
                           <div key={i} className="flex items-center space-x-4 p-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[150px]" />
                                </div>
                            </div>
                        ))
                    )}
                    {!notificationsLoading && notifications && notifications.length > 0 ? (
                        notifications.map(notif => (
                            <Card key={notif.id} className={cn("cursor-pointer transition-colors hover:border-primary", getCardClass(notif.type))} onClick={() => setSelectedNotification(notif as Notification)}>
                                <CardContent className="p-4 flex items-start gap-4">
                                    <Avatar className="mt-1">
                                         {notif.creatorName === 'Sistema' ? (
                                            <AvatarFallback className="bg-transparent text-amber-500"><AlertTriangle className="h-6 w-6"/></AvatarFallback>
                                        ) : (
                                            <AvatarFallback>{notif.creatorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <p>
                                            {notif.creatorName === 'Sistema' ? (
                                                <>
                                                    <span className="font-semibold text-amber-400">Alerta del Sistema:</span> {notif.message}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-semibold">{notif.creatorName}</span> {notif.message}
                                                </>
                                            )}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        !notificationsLoading && (
                            <div className="text-center text-muted-foreground py-16 px-4 border border-dashed rounded-lg">
                                <Bell className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-semibold">Todo tranquilo por aquí</h3>
                                <p className="mt-2 text-sm">No hay notificaciones nuevas.</p>
                            </div>
                        )
                    )}
                </div>
            </main>
            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    isOpen={!!selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </div>
    );
}
