'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, updateDoc } from 'firebase/firestore';
import {
  parseISO,
  format,
  differenceInCalendarDays,
  startOfDay,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

import type { Room, Reservation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/alert-dialog';
import {
  Calendar as CalendarIcon,
  User,
  DollarSign,
  Search,
  PlusCircle,
  Phone,
  Car,
  Bike,
  Truck,
  LayoutGrid,
  Users,
  Settings,
  LogOut,
  Wrench,
  Check,
  BarChart2,
} from 'lucide-react';
import { RoomDetailModal } from '@/components/dashboard/room-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';

// Combined type for display purposes
export interface ProcessedRoom extends Room {
  reservation?: Reservation;
  statusText: string;
  statusColor: string;
}

export default function RoomsDashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [selectedRoom, setSelectedRoom] = useState<ProcessedRoom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch data from Firestore
  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
  const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);

  const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);
  const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // Memoize reservation check-in dates for calendar markers
  const reservationDates = useMemo(() => {
    if (!reservationsData) return [];
    return reservationsData
      .map(r => parseISO(r.checkInDate))
      .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
  }, [reservationsData]);

  const processedRooms = useMemo((): ProcessedRoom[] => {
    if (!roomsData || !reservationsData || !selectedDate) return [];

    const startOfSelected = startOfDay(selectedDate);

    return roomsData.map((room) => {
      let statusText = 'Disponible';
      let statusColor = 'bg-green-500/20 text-green-400 border-green-500/50';
      let relevantReservation: Reservation | undefined = undefined;

      const overlappingReservations = reservationsData
        .filter(res => {
            if (res.roomId !== room.id || ['Cancelled', 'Checked-Out'].includes(res.status)) {
                return false;
            }
            const checkIn = startOfDay(parseISO(res.checkInDate));
            const checkOut = startOfDay(parseISO(res.checkOutDate));
            return startOfSelected >= checkIn && startOfSelected < checkOut;
        })
        .sort((a, b) => {
            if (a.status === 'Checked-In' && b.status !== 'Checked-In') return -1;
            if (b.status === 'Checked-In' && a.status !== 'Checked-In') return 1;
            return 0;
        });

      relevantReservation = overlappingReservations[0] as Reservation | undefined;

      if (room.status === 'Mantenimiento') {
        statusText = 'Mantenimiento';
        statusColor = 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      } else if (relevantReservation) {
        if (relevantReservation.status === 'Checked-In') {
           statusText = 'Ocupada';
           statusColor = 'bg-red-500/20 text-red-400 border-red-500/50';
        } else if (relevantReservation.status === 'Confirmed') {
            if (isSameDay(startOfDay(parseISO(relevantReservation.checkInDate)), startOfSelected)) {
                statusText = 'Llegada';
            } else {
                statusText = 'Reserva';
            }
           statusColor = 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        }
      }
      
      return {
        ...room,
        id: room.id,
        reservation: relevantReservation,
        statusText,
        statusColor,
      };
    }).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  }, [roomsData, reservationsData, selectedDate]);


  const ocupadasCount = processedRooms.filter(
    (room) => room.statusText === 'Ocupada'
  ).length;
  const disponiblesCount = processedRooms.filter(
    (room) => room.statusText === 'Disponible'
  ).length;
  const reservasCount = processedRooms.filter(
    (room) => room.statusText === 'Reserva' || room.statusText === 'Llegada'
  ).length;


  if (isUserLoading || !user || roomsLoading || reservationsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  const handleCardClick = (room: ProcessedRoom) => {
    setSelectedRoom(room);
  };

  const handleCloseModal = () => {
    setSelectedRoom(null);
  };

  const handleAction = async (reservationId: string, action: 'checkout' | 'confirm_payment') => {
      if (!firestore) return;
      const resDocRef = doc(firestore, 'reservations', reservationId);
      try {
          if (action === 'checkout') {
              await updateDoc(resDocRef, { status: 'Checked-Out' });
          } else if (action === 'confirm_payment') {
              await updateDoc(resDocRef, { 'payment.status': 'Cancelado' });
          }
      } catch (error) {
          console.error(`Error performing action ${action}:`, error);
      }
  };

  const filteredRooms = processedRooms.filter((room) => {
    if (!searchTerm) return true;
    if (!room.reservation) return false;
    return room.reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStayDate = (reservation?: Reservation) => {
      if (!reservation) return null;
      const checkIn = parseISO(reservation.checkInDate);
      const checkOut = parseISO(reservation.checkOutDate);
      const nights = differenceInCalendarDays(checkOut, checkIn);
      return `${format(checkIn, 'd LLL', {locale: es})} - ${format(checkOut, 'd LLL', {locale: es})} (${nights} ${nights === 1 ? 'noche' : 'noches'})`;
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold">Hotel RIGUT</h1>
        <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por huésped..."
            className="bg-card border-border pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-400"></div>
            <p className="text-sm font-medium"><span className="font-bold text-foreground">{disponiblesCount}</span> <span className="text-muted-foreground">Disponibles</span></p>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400"></div>
            <p className="text-sm font-medium"><span className="font-bold text-foreground">{ocupadasCount}</span> <span className="text-muted-foreground">Ocupadas</span></p>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-400"></div>
            <p className="text-sm font-medium"><span className="font-bold text-foreground">{reservasCount}</span> <span className="text-muted-foreground">Reservas</span></p>
        </div>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <Card className="bg-card border-border inline-block">
                <CardContent className="p-0">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                    modifiers={{ reserved: reservationDates }}
                    modifiersClassNames={{
                      reserved: 'bg-primary/80 text-primary-foreground rounded-full',
                    }}
                    className="p-4"
                />
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(roomsLoading || reservationsLoading) ? (
                [...Array(8)].map((_, i) => <Skeleton key={i} className="h-64" />)
            ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
                <Card
                key={room.id}
                onClick={() => handleCardClick(room)}
                className="bg-card border-border text-foreground flex flex-col cursor-pointer hover:border-primary transition-colors"
                >
                <CardHeader>
                    <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{room.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                        {room.type}
                        </p>
                    </div>
                    <Badge className={room.statusColor}>
                        {room.statusText}
                    </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow">
                    {room.reservation && (
                        <>
                            <div className="flex items-center text-sm">
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{room.reservation.guestName}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <span>{getStayDate(room.reservation)}</span>
                            </div>
                            {room.reservation.phone && <div className="flex items-center text-sm text-muted-foreground"><Phone className="mr-2 h-4 w-4" /><span>{room.reservation.phone}</span></div>}
                            {room.reservation.vehicle && <div className="flex items-center text-sm text-muted-foreground">
                                {room.reservation.vehicle === 'car' && <Car className="mr-2 h-4 w-4" />}
                                {room.reservation.vehicle === 'bike' && <Bike className="mr-2 h-4 w-4" />}
                                {room.reservation.vehicle === 'truck' && <Truck className="mr-2 h-4 w-4" />}
                                <span>Vehículo</span>
                            </div>}
                            {room.reservation.payment && (
                                <div className={`flex items-center text-sm pt-2 ${room.reservation.payment.status === 'Pendiente' ? 'text-red-400' : 'text-green-400'}`}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    <span>{room.reservation.payment.status}{room.reservation.payment.amount && ` (C$${room.reservation.payment.amount})`}</span>
                                </div>
                            )}
                        </>
                    )}
                    {room.statusText === 'Mantenimiento' && (
                        <div className="flex items-center text-sm text-orange-400"><Wrench className="mr-2 h-4 w-4" /><span>En mantenimiento</span></div>
                    )}
                    {room.statusText === 'Disponible' && (
                        <div className="text-center flex-grow flex flex-col justify-center items-center">
                            <p className="text-muted-foreground">Limpia y lista</p>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="mt-auto flex flex-col gap-2 pt-4">
                    {room.reservation && room.statusText === 'Ocupada' ? (
                        room.reservation.payment?.status === 'Pendiente' ? (
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full font-semibold text-white bg-yellow-600 hover:bg-yellow-700">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Registrar Pago
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-xs rounded-3xl">
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar pago?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción marcará la cuenta de {room.reservation.guestName} como pagada.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction(room.reservation!.id, 'confirm_payment')}>Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full bg-secondary hover:bg-accent text-secondary-foreground">
                                <LogOut className="mr-2 h-4 w-4" />
                                Checkout
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-xs rounded-3xl">
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar Check-out?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esto finalizará la estadía de {room.reservation.guestName} y marcará la habitación como disponible.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction(room.reservation!.id, 'checkout')}>Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        )
                    ) : room.statusText === 'Disponible' ? (
                        <Button asChild className="w-full bg-secondary hover:bg-accent text-secondary-foreground"><Link href="/new-reservation"><PlusCircle className="mr-2 h-4 w-4" />Crear Reserva</Link></Button>
                    ) : room.reservation && (room.statusText === 'Reserva' || room.statusText === 'Llegada') ? (
                        <Button className="w-full" onClick={() => updateDoc(doc(firestore, 'reservations', room.reservation!.id), { status: 'Checked-In' })}><Check className="mr-2 h-4 w-4" />Check-in</Button>
                    ) : null }

                </CardFooter>
                </Card>
            ))
            ) : (
            <div className="col-span-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                No se encontraron habitaciones que coincidan con la búsqueda.
            </div>
            )}
        </div>
      </main>

      <Link href="/new-reservation">
        <Button
          size="lg"
          className="fixed z-20 bottom-24 right-4 rounded-full shadow-xl h-auto py-3 px-5 md:bottom-8 md:right-8 flex items-center gap-2"
          aria-label="Nueva Reserva"
        >
          <PlusCircle className="h-6 w-6" />
          <span className="text-base font-semibold">Nueva Reserva</span>
        </Button>
      </Link>

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          isOpen={!!selectedRoom}
          onClose={handleCloseModal}
        />
      )}

      <div className="text-center text-sm text-muted-foreground mt-12">
        <p>Desarrollado por Carlos Rivera</p>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-10 md:hidden">
        <div className="flex justify-around">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-primary px-2 py-1"
            >
              <LayoutGrid className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Habitaciones</span>
            </Button>
          </Link>
          <Link href="/reservations">
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1"
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
