'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Users,
  Settings,
  User,
  PlusCircle,
  AlertCircle,
  BarChart2,
  Wrench,
  Home,
} from 'lucide-react';
import { format, parseISO, isSameDay, startOfToday, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Reservation, Room } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Group reservations by date
const groupReservationsByDay = (reservations: Reservation[]) => {
  return reservations.reduce((acc, reservation) => {
    const dateKey = format(parseISO(reservation.checkInDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(reservation);
    return acc;
  }, {} as Record<string, Reservation[]>);
};

function ReservationList({ reservations, rooms, isLoading }: { reservations: Reservation[], rooms: Room[] | null, isLoading: boolean}) {
    const roomMap = useMemo(() => {
        if (!rooms) return new Map();
        return new Map(rooms.map(room => [room.id, room.title]));
    }, [rooms]);

    const getStatusBadge = (status: Reservation['status']) => {
        switch (status) {
            case 'Checked-In':
                return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'Checked-Out':
                return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'Cancelled':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
            default:
                return 'bg-secondary text-secondary-foreground';
        }
    };
    
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="bg-card border-border">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <User className="mr-2 h-4 w-4" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }
    
    if (reservations.length === 0) {
        return (
            <div className="flex items-center justify-center text-center text-muted-foreground h-full rounded-lg border border-dashed min-h-[200px]">
                <div className="p-8">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4">No hay reservas para mostrar.</p>
                </div>
            </div>
        );
    }

    const groupedReservations = groupReservationsByDay(reservations);

    return (
        <div className="space-y-6">
            {Object.entries(groupedReservations)
                .sort(([dateA], [dateB]) => parseISO(dateA).getTime() - parseISO(dateB).getTime())
                .map(([dateStr, dailyReservations]) => (
                <div key={dateStr}>
                    <h2 className="text-base font-semibold text-muted-foreground mb-3 sticky top-16 bg-background py-2 z-10">
                        {format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: es })}
                    </h2>
                    <div className="space-y-3">
                        {dailyReservations.map((res) => (
                            <Card key={res.id} className="bg-card border-border">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold flex items-center gap-2">
                                            <Home className="h-4 w-4 text-muted-foreground" />
                                            {roomMap.get(res.roomId) || `Habitación ${res.roomId}`}
                                        </p>
                                        <Badge className={getStatusBadge(res.status)}>
                                            {res.status === 'Checked-In' ? 'Check-in' : res.status === 'Checked-Out' ? 'Check-out' : 'Cancelada'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>{res.guestName}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-1">
                                        Check-out: {format(parseISO(res.checkOutDate), "d LLL yyyy", { locale: es })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function ReservationsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const reservationsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'reservations'), orderBy('checkInDate', 'desc')) : null),
    [firestore]
  );
  const {
    data: reservations,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useCollection<Omit<Reservation, 'id'>>(reservationsQuery);
  
  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
  const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);
  
  const today = startOfToday();
  const upcomingReservations = useMemo(() => {
      if (!reservations) return [];
      return reservations.filter(r => !isBefore(parseISO(r.checkInDate), today) || r.status === 'Checked-In');
  }, [reservations]);
  
   const pastReservations = useMemo(() => {
      if (!reservations) return [];
      return reservations.filter(r => isBefore(parseISO(r.checkInDate), today) && r.status !== 'Checked-In')
        .sort((a,b) => parseISO(b.checkInDate).getTime() - parseISO(a.checkInDate).getTime());
  }, [reservations]);


  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 mb-4 px-4 sm:px-6 lg:px-8 py-4 border-b">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Reservas</h1>
            <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
            <Link href="/new-reservation">
                <PlusCircle className="mr-2 h-5 w-5" />
                Nueva
            </Link>
            </Button>
        </div>
      </header>

      <main>
        {reservationsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de Permisos</AlertTitle>
              <AlertDescription>
                No tienes permisos para ver las reservas. Contacta a un
                administrador.
              </AlertDescription>
            </Alert>
        )}
        {!reservationsError && (
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                    <TabsTrigger value="past">Pasadas</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                    <ReservationList reservations={upcomingReservations as Reservation[]} rooms={roomsData as Room[]} isLoading={reservationsLoading || roomsLoading} />
                </TabsContent>
                <TabsContent value="past" className="mt-6">
                    <ReservationList reservations={pastReservations as Reservation[]} rooms={roomsData as Room[]} isLoading={reservationsLoading || roomsLoading} />
                </TabsContent>
            </Tabs>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/50 border-t border-border p-2 z-10 backdrop-blur-sm md:hidden">
        <div className="flex justify-around">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1"
            >
              <LayoutGrid className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Habitaciones</span>
            </Button>
          </Link>
          <Link href="/reservations">
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-primary bg-primary/10 rounded-lg px-2 py-1"
            >
              <CalendarIcon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Reservas</span>
            </Button>
          </Link>
          <Link href="/tools">
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1"
            >
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
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1"
            >
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Ajustes</span>
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
