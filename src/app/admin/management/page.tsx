'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Home, User, DollarSign, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

import type { Reservation, Room, Expense } from '@/lib/types';

export default function AdminManagementPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Admin role check
    const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{role: 'Admin' | 'Socio'}>(userDocRef);

    // Data fetching
    const reservationsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'reservations'), orderBy('checkInDate', 'desc')) : null, [firestore]);
    const { data: reservations, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsQuery);

    const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('date', 'desc')) : null, [firestore]);
    const { data: expenses, isLoading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

    const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
    const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);

    const roomMap = useMemo(() => {
        if (!roomsData) return new Map();
        return new Map(roomsData.map(room => [room.id, room.title]));
    }, [roomsData]);

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

    const handleDelete = (collectionName: string, docId: string, description: string) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, collectionName, docId)).then(() => {
            toast({
                title: 'Registro Eliminado',
                description: `Se ha eliminado: ${description}.`,
                variant: 'destructive',
            });
        });
    };

    const currencyFormatter = new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    });

    const isLoading = isUserLoading || isUserProfileLoading || reservationsLoading || expensesLoading || roomsLoading;
    if (isLoading) {
        return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8"><p>Cargando datos de administración...</p></div>;
    }
     if (!user || !userProfile || userProfile.role !== 'Admin') {
        return null;
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Gestión de Administración</h1>
            </header>

            <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Reservations Section */}
                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestionar Reservas</CardTitle>
                            <CardDescription>Elimina registros de reservas de clientes.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {reservations && reservations.length > 0 ? (
                                    reservations.map((res, index) => (
                                        <div key={res.id}>
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex-grow space-y-1">
                                                    <p className="font-medium truncate flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> {res.guestName}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center"><Home className="mr-1 h-3 w-3"/>{roomMap.get(res.roomId) || 'N/A'}</span>
                                                        <span className="flex items-center"><CalendarIcon className="mr-1 h-3 w-3"/>{format(parseISO(res.checkInDate), 'd MMM yyyy', { locale: es })}</span>
                                                    </div>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Se eliminará permanentemente la reserva de <strong>{res.guestName}</strong>. Esta acción no se puede deshacer.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete('reservations', res.id, `reserva de ${res.guestName}`)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            {index < reservations.length - 1 && <Separator />}
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-muted-foreground">No hay reservas para mostrar.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Expenses Section */}
                <section>
                    <Card>
                         <CardHeader>
                            <CardTitle>Gestionar Gastos</CardTitle>
                            <CardDescription>Elimina registros de gastos.</CardDescription>
                        </CardHeader>
                         <CardContent className="p-0">
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {expenses && expenses.length > 0 ? (
                                    expenses.map((exp, index) => (
                                         <div key={exp.id}>
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex-grow space-y-1">
                                                    <p className="font-medium truncate">{exp.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center"><Tag className="mr-1 h-3 w-3"/>{exp.category}</span>
                                                        <span className="font-semibold">{currencyFormatter.format(exp.amount)}</span>
                                                    </div>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Se eliminará permanentemente el gasto: <strong>{exp.description}</strong>. Esta acción no se puede deshacer.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete('expenses', exp.id, `gasto '${exp.description}'`)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            {index < expenses.length - 1 && <Separator />}
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-muted-foreground">No hay gastos para mostrar.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}
