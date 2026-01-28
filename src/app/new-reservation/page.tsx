'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, ArrowLeft, Car, Bike, Truck, User, Fingerprint, Phone, Home, StickyNote, Camera } from 'lucide-react';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking } from '@/firebase';
import type { Room, Reservation, NotificationConfig } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';


const reservationFormSchema = z.object({
  guestName: z
    .string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  cedula: z.string().optional(),
  phone: z
    .string()
    .regex(/^\d{4}-\d{4}$/, { message: "El teléfono debe tener el formato 8888-8888." })
    .optional()
    .or(z.literal('')),
  checkInDate: z.date({
    required_error: 'La fecha de check-in es obligatoria.',
  }),
  checkOutDate: z.date({
    required_error: 'La fecha de check-out es obligatoria.',
  }),
  roomId: z.string({ required_error: 'Debe seleccionar una habitación.' }),
  vehicle: z.enum(['car', 'bike', 'truck']).optional(),
  notes: z.string().optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
    message: "La fecha de check-out debe ser posterior a la de check-in.",
    path: ["checkOutDate"],
});

function NewReservationFormComponent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
  const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);
  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const notificationConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'notification_config') : null, [firestore]);
  
  const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);
  const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{username: string}>(userDocRef);
  const { data: notificationConfig } = useDoc<Omit<NotificationConfig, 'id'>>(notificationConfigRef);


  const form = useForm<z.infer<typeof reservationFormSchema>>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      guestName: '',
      cedula: '',
      phone: '',
      vehicle: undefined,
      notes: '',
    },
  });

  const { watch } = form;
  const checkInDate = watch("checkInDate");
  const checkOutDate = watch("checkOutDate");

  useEffect(() => {
    const prefillGuestName = searchParams.get('guestName');
    const prefillCedula = searchParams.get('cedula');
    if (prefillGuestName) {
        form.setValue('guestName', prefillGuestName, { shouldValidate: true });
    }
    if (prefillCedula) {
        form.setValue('cedula', prefillCedula, { shouldValidate: true });
    }
  }, [searchParams, form]);


  const availableRooms = useMemo(() => {
    if (!roomsData || !reservationsData || !checkInDate || !checkOutDate) {
        return roomsData?.filter(room => room.status === 'Disponible') || [];
    }

    const reservedRoomIds = new Set(
        reservationsData
            .filter(res => {
                if (res.status === 'Cancelled' || res.status === 'Checked-Out') return false;
                const resCheckIn = new Date(res.checkInDate);
                const resCheckOut = new Date(res.checkOutDate);
                // Check for overlap
                return checkInDate < resCheckOut && checkOutDate > resCheckIn;
            })
            .map(res => res.roomId)
    );

    return roomsData.filter(room => room.status === 'Disponible' && !reservedRoomIds.has(room.id));
  }, [roomsData, reservationsData, checkInDate, checkOutDate]);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allCustomers = useMemo(() => {
    if (!reservationsData) return [];

    const customerMap: { [key: string]: { name: string; cedula?: string; phone?: string } } = {};

    const sortedReservations = [...reservationsData].sort(
      (a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
    );

    sortedReservations.forEach(res => {
      if (!res.guestName) return;
      const key = res.guestName.toLowerCase();
      if (!customerMap[key]) {
        customerMap[key] = {
          name: res.guestName,
          cedula: res.cedula,
          phone: res.phone,
        };
      }
    });

    return Object.values(customerMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [reservationsData]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return [];
    return allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allCustomers]);

  const handleSelectCustomer = (customer: { name: string; cedula?: string; phone?: string }) => {
    form.setValue('guestName', customer.name, { shouldValidate: true });
    form.setValue('cedula', customer.cedula || '', { shouldValidate: true });
    form.setValue('phone', customer.phone || '', { shouldValidate: true });
    setSearchQuery(customer.name);
    setShowSuggestions(false);
  };

  async function onSubmit(data: z.infer<typeof reservationFormSchema>) {
    if (!firestore || !user || !roomsData || !reservationsCollection || !userProfile) return;
    setIsSubmitting(true);

    const room = roomsData.find(r => r.id === data.roomId);
    const nights = differenceInCalendarDays(data.checkOutDate, data.checkInDate);
    const totalAmount = room && nights > 0 ? room.price * nights : 0;
    
    const reservationData = {
      guestName: data.guestName,
      cedula: data.cedula || '',
      phone: data.phone || '',
      checkInDate: data.checkInDate.toISOString(),
      checkOutDate: data.checkOutDate.toISOString(),
      roomId: data.roomId,
      ...(data.vehicle && { vehicle: data.vehicle }),
      ...(data.notes && { notes: data.notes }),
      status: 'Checked-In' as const,
      payment: {
        status: 'Pendiente' as const,
        amount: totalAmount,
      },
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    };

    addDocumentNonBlocking(reservationsCollection, reservationData)
        .then(() => {
            const roomTitle = room?.title || `Habitación ${data.roomId}`;
            toast({
                title: 'Check-in Realizado',
                description: `${data.guestName} ha sido registrado en ${roomTitle}.`,
            });

            if (notificationConfig?.isEnabled && notificationConfig.onNewReservation) {
                const notificationsColRef = collection(firestore, 'notifications');
                const notificationData = {
                    message: `registró un nuevo check-in para ${data.guestName} en la habitación ${roomTitle}.`,
                    createdAt: new Date().toISOString(),
                    createdBy: user.uid,
                    creatorName: userProfile.username,
                    isRead: false,
                };
                addDocumentNonBlocking(notificationsColRef, notificationData);
            }

            router.push('/dashboard');
        })
        .catch((error) => {
            console.error("Error creating reservation:", error);
            toast({
                variant: 'destructive',
                title: 'Error al crear la reserva',
                description: 'No se pudo registrar el check-in. Verifica tus permisos e inténtalo de nuevo.',
            });
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  }


  if (isUserLoading || !user || roomsLoading || reservationsLoading || isUserProfileLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 pt-12 sm:p-6 lg:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <h1 className="text-2xl font-bold flex-grow">Registrar Check-in</h1>
        <Button asChild variant="outline" size="icon">
          <Link href="/reservations/scan">
            <Camera className="h-5 w-5" />
            <span className="sr-only">Escanear Cédula</span>
          </Link>
        </Button>
      </header>

      <main className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Huésped</FormLabel>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <User className="absolute left-3 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Buscar o registrar huésped..."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setSearchQuery(e.target.value);
                            if (!showSuggestions) setShowSuggestions(true);
                          }}
                          onFocus={() => {
                            setSearchQuery(field.value);
                            setShowSuggestions(true);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowSuggestions(false);
                            }, 150);
                          }}
                          autoComplete="off"
                          className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary"
                        />
                      </FormControl>
                    </div>
                    {showSuggestions && filteredCustomers.length > 0 && searchQuery !== form.getValues('guestName') && (
                      <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.map((customer, index) => (
                          <div
                            key={index}
                            className="p-3 cursor-pointer hover:bg-muted"
                            onMouseDown={() => handleSelectCustomer(customer)}
                          >
                            <p className="font-medium">{customer.name}</p>
                            {customer.cedula && <p className="text-sm text-muted-foreground">{customer.cedula}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cedula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula (Opcional)</FormLabel>
                  <div className="relative flex items-center">
                    <Fingerprint className="absolute left-3 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="Ej: 001-000000-0000A"
                        {...field}
                        onChange={(e) => {
                            const input = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            if (input.length <= 14) {
                                let formatted = input;
                                if (input.length > 9) {
                                    formatted = `${input.substring(0, 3)}-${input.substring(3, 9)}-${input.substring(9)}`;
                                } else if (input.length > 3) {
                                    formatted = `${input.substring(0, 3)}-${input.substring(3)}`;
                                }
                                field.onChange(formatted);
                            }
                        }}
                        className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (Opcional)</FormLabel>
                   <div className="relative flex items-center">
                    <Phone className="absolute left-3 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Ej: 8888-8888"
                        {...field}
                        onChange={(e) => {
                            const input = e.target.value;
                            const digitsOnly = input.replace(/[^0-9]/g, '');
                            if (digitsOnly.length <= 8) {
                                let formatted = digitsOnly;
                                if (digitsOnly.length > 4) {
                                    formatted = `${digitsOnly.substring(0, 4)}-${digitsOnly.substring(4)}`;
                                }
                                field.onChange(formatted);
                            }
                        }}
                        className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Check-in</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'ghost'}
                            className={cn(
                              'w-full justify-start text-left font-normal border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Check-out</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'ghost'}
                            className={cn(
                              'w-full justify-start text-left font-normal border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <
                            (form.getValues('checkInDate') ||
                              new Date(new Date().setHours(0, 0, 0, 0)))
                          }
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habitación</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!checkInDate || !checkOutDate}
                  >
                    <FormControl>
                       <div className="relative flex items-center">
                        <Home className="absolute left-3 h-5 w-5 text-muted-foreground" />
                        <SelectTrigger className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus:ring-0 focus:ring-offset-0 focus:border-primary">
                          <SelectValue placeholder={!checkInDate || !checkOutDate ? "Primero selecciona las fechas" : "Seleccionar una habitación disponible"} />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          {room.title} - {room.type} (C${room.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Vehículo (Opcional)</FormLabel>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => field.onChange(field.value === 'car' ? undefined : 'car')}
                        className={cn(
                          "h-auto flex-col items-center justify-between p-3 border-2 rounded-lg",
                          field.value === 'car'
                            ? 'border-primary bg-primary/10'
                            : 'border-muted bg-transparent'
                        )}
                      >
                        <Car className="mb-2 h-5 w-5" />
                        Carro
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => field.onChange(field.value === 'bike' ? undefined : 'bike')}
                        className={cn(
                          "h-auto flex-col items-center justify-between p-3 border-2 rounded-lg",
                          field.value === 'bike'
                            ? 'border-primary bg-primary/10'
                            : 'border-muted bg-transparent'
                        )}
                      >
                        <Bike className="mb-2 h-5 w-5" />
                        Moto
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => field.onChange(field.value === 'truck' ? undefined : 'truck')}
                        className={cn(
                          "h-auto flex-col items-center justify-between p-3 border-2 rounded-lg",
                          field.value === 'truck'
                            ? 'border-primary bg-primary/10'
                            : 'border-muted bg-transparent'
                        )}
                      >
                        <Truck className="mb-2 h-5 w-5" />
                        Camión
                      </Button>
                    </div>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                  <div className="relative flex items-start">
                    <StickyNote className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Cliente prefiere habitaciones silenciosas, alérgico a..."
                        className="pl-10 resize-none bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando Check-in...' : 'Registrar Check-in'}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}

export default function NewReservationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center bg-background p-8"><p>Cargando...</p></div>}>
      <NewReservationFormComponent />
    </Suspense>
  )
}
