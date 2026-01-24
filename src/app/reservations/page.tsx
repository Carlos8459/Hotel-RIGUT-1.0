'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar } from '@/components/ui/calendar';
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
} from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Reservation } from '@/lib/types';


export default function ReservationsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const reservationsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'reservations') : null),
    [firestore]
  );
  const {
    data: reservations,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const reservationDates = useMemo(() => {
    return (
      reservations
        ?.map((r) => parseISO(r.checkInDate))
        .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime())) || []
    );
  }, [reservations]);

  const selectedDateReservations = useMemo(() => {
    if (!date || !reservations) return [];
    return reservations.filter((r) => {
      const checkIn = parseISO(r.checkInDate);
      return isSameDay(checkIn, date);
    });
  }, [date, reservations]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p>Cargando...</p>
      </div>
    );
  }

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

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Reservas</h1>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Link href="/new-reservation">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nueva Reserva
          </Link>
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex justify-center">
          <Card className="bg-card border-border inline-block">
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={es}
                modifiers={{ reserved: reservationDates }}
                modifiersClassNames={{
                  reserved: 'bg-primary text-primary-foreground rounded-full',
                }}
                className="p-4"
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Reservas para{' '}
            {date ? format(date, 'd MMMM yyyy', { locale: es }) : '...'}
          </h2>
          {reservationsLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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
          )}
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
          {!reservationsLoading && !reservationsError && (
            <>
              {selectedDateReservations.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateReservations.map((res) => (
                    <Card key={res.id} className="bg-card border-border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-bold">Habitación {res.roomId}</p>
                          <Badge className={getStatusBadge(res.status)}>
                            {res.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="mr-2 h-4 w-4" />
                          <span>{res.guestName}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-center text-muted-foreground h-full rounded-lg border border-dashed">
                  <div className="p-8">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4">No hay reservas para esta fecha.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
          <Link href="/customers">
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1"
            >
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Clientes</span>
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
