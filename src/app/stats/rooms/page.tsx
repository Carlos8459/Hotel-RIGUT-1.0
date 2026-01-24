'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { parseISO, differenceInCalendarDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, DollarSign, BedDouble, TrendingUp, Moon } from 'lucide-react';
import type { Reservation, Room } from '@/lib/types';

interface RoomStats extends Room {
    totalIncome: number;
    occupancyCount: number;
    totalNights: number;
    averageIncomePerStay: number;
}


export default function RoomStatsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    
    // Data fetching
    const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
    const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);

    const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);
    const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const roomStats: RoomStats[] = useMemo(() => {
        if (!roomsData || !reservationsData) return [];

        return roomsData.map(room => {
            const roomReservations = reservationsData.filter(res => res.roomId === room.id);
            const paidReservations = roomReservations.filter(res => res.payment?.status === 'Cancelado');
            
            const totalIncome = paidReservations.reduce((acc, res) => acc + (res.payment?.amount || 0), 0);
            const occupancyCount = roomReservations.length;
            const totalNights = roomReservations.reduce((acc, res) => {
                const nights = differenceInCalendarDays(parseISO(res.checkOutDate), parseISO(res.checkInDate));
                return acc + (nights > 0 ? nights : 0);
            }, 0);
            const averageIncomePerStay = occupancyCount > 0 ? totalIncome / occupancyCount : 0;

            return {
                ...room,
                id: room.id,
                totalIncome,
                occupancyCount,
                totalNights,
                averageIncomePerStay,
            };
        }).sort((a, b) => b.totalIncome - a.totalIncome);

    }, [roomsData, reservationsData]);


    const currencyFormatter = new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 0,
    });

    const isLoading = isUserLoading || roomsLoading || reservationsLoading;

    if (isLoading) {
        return (
            <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
                <header className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-7 w-48" />
                </header>
                 <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
                 </main>
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
                    <h1 className="text-2xl font-bold">Estadísticas por Habitación</h1>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomStats.map(room => (
                    <Card key={room.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{room.title}</CardTitle>
                            <CardDescription>{room.type}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div>
                                    <p className="font-bold text-base">{currencyFormatter.format(room.totalIncome)}</p>
                                    <p className="text-muted-foreground">Ingresos Totales</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <BedDouble className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div>
                                    <p className="font-bold text-base">{room.occupancyCount}</p>
                                    <p className="text-muted-foreground">Estadías</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Moon className="h-4 w-4 mr-2 text-muted-foreground" />
                                 <div>
                                    <p className="font-bold text-base">{room.totalNights}</p>
                                    <p className="text-muted-foreground">Noches Ocupada</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                                 <div>
                                    <p className="font-bold text-base">{currencyFormatter.format(room.averageIncomePerStay)}</p>
                                    <p className="text-muted-foreground">Ingreso Promedio</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </main>
        </div>
    );
}
