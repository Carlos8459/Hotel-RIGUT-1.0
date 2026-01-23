'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notification } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

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
                            <Card key={notif.id} className="bg-card">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <Avatar className="mt-1">
                                        <AvatarFallback>{notif.creatorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p><span className="font-semibold">{notif.creatorName}</span> {notif.message.substring(notif.message.indexOf(" registró"))}</p>
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
        </div>
    );
}
