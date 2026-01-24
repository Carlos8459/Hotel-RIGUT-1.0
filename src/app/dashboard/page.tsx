'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, updateDoc, addDoc } from 'firebase/firestore';
import {
  parseISO,
  format,
  differenceInCalendarDays,
  startOfDay,
  isSameDay,
  addDays,
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
  CardDescription,
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
  BarChart2,
  Bell,
  ShoppingCart,
  Utensils,
  GlassWater,
  Droplet,
  Droplets,
  Beer,
  Coffee,
  Sandwich,
  CakeSlice,
  IceCream,
  Package,
} from 'lucide-react';
import { RoomDetailModal } from '@/components/dashboard/room-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


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
  const { toast } = useToast();

  const [selectedRoom, setSelectedRoom] = useState<ProcessedRoom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // Fetch data from Firestore
  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
  const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);
  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);
  const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{username: string}>(userDocRef);

  const consumptionIcons: { [key: string]: React.ReactNode } = {
    Utensils: <Utensils className="h-4 w-4" />,
    GlassWater: <GlassWater className="h-4 w-4" />,
    Droplet: <Droplet className="h-4 w-4" />,
    Droplets: <Droplets className="h-4 w-4" />,
    Beer: <Beer className="h-4 w-4" />,
    Coffee: <Coffee className="h-4 w-4" />,
    Sandwich: <Sandwich className="h-4 w-4" />,
    CakeSlice: <CakeSlice className="h-4 w-4" />,
    IceCream: <IceCream className="h-4 w-4" />,
    Package: <Package className="h-4 w-4" />,
  };


  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    } else if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const visibleDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

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
    <div className="dark min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/50 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Hotel RIGUT</h1>
        <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por huésped..."
                    className="bg-card border-border pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Link href="/whatsapp">
                <Button variant="ghost" size="icon">
                    <WhatsAppIcon className="h-6 w-6 fill-current" />
                    <span className="sr-only">WhatsApp Automation</span>
                </Button>
            </Link>
            <Link href="/notifications">
                <Button variant="ghost" size="icon">
                    <Bell className="h-6 w-6" />
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </Link>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex space-x-1 rounded-lg bg-card p-1 w-min">
              {visibleDates.map((date) => (
                <Button
                  key={date.toISOString()}
                  variant={isSameDay(date, selectedDate) ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedDate(startOfDay(date))}
                  className="flex-1 flex-col h-auto px-3 py-2 text-center"
                >
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {format(date, 'EEE', { locale: es })}
                  </span>
                  <span className="text-xl font-bold">{format(date, 'd')}</span>
                </Button>
              ))}
            </div>
        </div>
        
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      {room.reservation ? (
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
                              {room.reservation.extraConsumptions && room.reservation.extraConsumptions.length > 0 && (
                                <div className="pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                                        <ShoppingCart className="h-4 w-4" />
                                        {room.reservation.extraConsumptions.map(item => (
                                            <div key={item.name} className="flex items-center" title={`${item.quantity} x ${item.name}`}>
                                                {consumptionIcons[item.icon] || <Package className="h-4 w-4" />}
                                                <span className="ml-1 font-bold text-foreground">{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                              )}
                          </>
                      ) : room.statusText === 'Mantenimiento' ? (
                          <div className="flex items-center text-sm text-orange-400"><Wrench className="mr-2 h-4 w-4" /><span>En mantenimiento</span></div>
                      ) : (
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
                      ) : null }

                  </CardFooter>
                  </Card>
              ))
              ) : (
              <div className="col-span-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                  No se encontraron habitaciones que coincidan con la búsqueda.
              </div>
              )}
        </main>
      </div>

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

      <footer className="fixed bottom-0 left-0 right-0 bg-background/50 border-t border-border p-2 z-10 backdrop-blur-sm md:hidden">
        <div className="flex justify-around">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center text-primary bg-primary/10 rounded-lg px-2 py-1"
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
