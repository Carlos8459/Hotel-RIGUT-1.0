'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, UpdateData } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Fingerprint, Phone, Tag, StickyNote, Car, Bike, Truck, Home, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reservation, Room } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';

const roomTypes: Room['type'][] = ["Unipersonal", "Matrimonial", "Doble", "Triple", "Quintuple", "Unipersonal con A/C", "Matrimonial con A/C"];

const editReservationSchema = z.object({
  roomId: z.string({ required_error: "Debe seleccionar una habitación." }),
  type: z.enum(roomTypes, { required_error: 'Debe seleccionar un tipo de cobro.' }),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  guestName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  cedula: z.string().optional(),
  phone: z.string().regex(/^\d{4}-\d{4}$/, { message: "El teléfono debe tener el formato 8888-8888." }).optional().or(z.literal('')),
  nickname: z.string().optional(),
  notes: z.string().optional(),
  vehicle: z.enum(['car', 'bike', 'truck']).optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
    message: "La fecha de check-out debe ser posterior a la de check-in.",
    path: ["checkOutDate"],
});


type UserProfile = {
    role: 'Admin' | 'Socio' | 'Colaborador';
    permissions: { [key: string]: boolean | undefined };
} | null | undefined;

type EditReservationModalProps = {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
  allRooms: Room[];
  allReservations: Reservation[];
  userProfile: UserProfile;
};

function calculateTotalAmount(
    originalReservation: Reservation,
    newData: z.infer<typeof editReservationSchema>,
    typePriceMap: Map<string, number>
): number {
    let roomTotal = 0;
    let lastDate = parseISO(originalReservation.checkInDate);

    // 1. Add up cost from past room segments
    if (originalReservation.roomHistory) {
        for (const segment of originalReservation.roomHistory) {
            const movedAt = parseISO(segment.movedAt);
            const nights = differenceInCalendarDays(movedAt, lastDate);
            if (nights > 0) {
                const price = typePriceMap.get(segment.type!) || 0;
                roomTotal += price * nights;
            }
            lastDate = movedAt;
        }
    }

    const isRoomChange = newData.roomId !== originalReservation.roomId;
    
    if (isRoomChange) {
        // Cost of current segment until now
        const nightsUntilNow = differenceInCalendarDays(new Date(), lastDate);
        if (nightsUntilNow > 0) {
            const price = typePriceMap.get(originalReservation.type) || 0;
            roomTotal += price * nightsUntilNow;
        }

        // Cost of future segment from now until new checkout
        const futureNights = differenceInCalendarDays(newData.checkOutDate, new Date());
        if (futureNights > 0) {
            const price = typePriceMap.get(newData.type) || 0;
            roomTotal += price * futureNights;
        }

        // Handle day-stay in new room if moving today and checking out today
        if (differenceInCalendarDays(newData.checkOutDate, new Date()) <= 0) {
            roomTotal += typePriceMap.get(newData.type) || 0;
        }
    } else { // No room change
        const nights = differenceInCalendarDays(newData.checkOutDate, lastDate);
        const price = typePriceMap.get(newData.type) || 0;
        if (nights > 0) {
            roomTotal += price * nights;
        } else { // Handle day stays
             roomTotal += price;
        }
    }

    const consumptionsTotal = originalReservation.extraConsumptions?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
    
    return roomTotal + consumptionsTotal;
}


export function EditReservationModal({ reservation, isOpen, onClose, allRooms, allReservations, userProfile }: EditReservationModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof editReservationSchema>>({
    resolver: zodResolver(editReservationSchema),
    defaultValues: {
      roomId: '',
      type: "Unipersonal",
      guestName: '',
      cedula: '',
      phone: '',
      nickname: '',
      notes: '',
      vehicle: undefined,
    },
  });

  const typePriceMap = useMemo(() => {
    const customPrices: Record<Room['type'], number> = {
        "Unipersonal": 400,
        "Matrimonial": 500,
        "Doble": 600,
        "Triple": 700,
        "Quintuple": 1000,
        "Unipersonal con A/C": 700,
        "Matrimonial con A/C": 800,
    };
    const map = new Map<string, number>();
    roomTypes.forEach(type => map.set(type, customPrices[type]));
    return map;
  }, []);

  useEffect(() => {
    if (reservation) {
      form.reset({
        roomId: reservation.roomId,
        type: reservation.type,
        checkInDate: parseISO(reservation.checkInDate),
        checkOutDate: parseISO(reservation.checkOutDate),
        guestName: reservation.guestName,
        cedula: reservation.cedula || '',
        phone: reservation.phone || '',
        nickname: reservation.nickname || '',
        notes: reservation.notes || '',
        vehicle: reservation.vehicle,
      });
    }
  }, [reservation, form, isOpen]);

  const availableRooms = useMemo(() => {
    if (!allRooms || !allReservations || !reservation) return [];

    const checkInDate = parseISO(reservation.checkInDate);
    const checkOutDate = parseISO(reservation.checkOutDate);

    const reservedRoomIds = new Set(
        allReservations
            .filter(res => {
                if (res.id === reservation.id) return false;
                if (res.status === 'Cancelled' || res.status === 'Checked-Out') return false;
                const resCheckIn = parseISO(res.checkInDate);
                const resCheckOut = parseISO(res.checkOutDate);
                return checkInDate < resCheckOut && checkOutDate > resCheckIn;
            })
            .map(res => res.roomId)
    );

    const filteredRooms = allRooms.filter(room => {
        return room.status === 'Disponible' && !reservedRoomIds.has(room.id);
    });

    const currentRoom = allRooms.find(r => r.id === reservation.roomId);
    if (currentRoom && !filteredRooms.some(r => r.id === currentRoom.id)) {
        filteredRooms.push(currentRoom);
    }
    
    return filteredRooms.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  }, [allRooms, allReservations, reservation]);

  const canPerformActions = userProfile && userProfile.role !== 'Colaborador';

  const onSubmit = async (data: z.infer<typeof editReservationSchema>) => {
    if (!firestore || !canPerformActions) return;
    setIsSaving(true);

    const resDocRef = doc(firestore, 'reservations', reservation.id);

    try {
        const newTotalAmount = calculateTotalAmount(reservation, data, typePriceMap);
        
        const dataToUpdate: UpdateData<Reservation> = {
            guestName: data.guestName,
            cedula: data.cedula,
            phone: data.phone,
            nickname: data.nickname,
            notes: data.notes,
            vehicle: data.vehicle,
            type: data.type,
            'payment.amount': newTotalAmount,
            checkOutDate: data.checkOutDate.toISOString(),
        };

        if (data.roomId !== reservation.roomId) {
            const historyEntry = {
                roomId: reservation.roomId,
                movedAt: new Date().toISOString(),
                type: reservation.type,
            };
            dataToUpdate.roomHistory = [
                ...(reservation.roomHistory || []),
                historyEntry
            ];
            dataToUpdate.roomId = data.roomId;
        }

      await updateDocumentNonBlocking(resDocRef, dataToUpdate);
      toast({
        title: 'Reserva Actualizada',
        description: 'Los datos de la estadía se han guardado correctamente.',
      });
      onClose();
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast({
        title: 'Error al actualizar',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border rounded-3xl">
        <DialogHeader>
          <DialogTitle>Editar Estadía</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la estadía para {reservation.guestName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="checkInDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn('w-full justify-start text-left font-normal',!field.value && 'text-muted-foreground')}
                              disabled
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP', { locale: es }) : <span></span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="checkOutDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-out</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP', { locale: es }) : <span></span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < (form.getValues('checkInDate') || new Date())}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cambiar Habitación</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <div className="relative flex items-center">
                                <Home className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                <SelectTrigger className="pl-10">
                                    <SelectValue placeholder="Seleccionar nueva habitación" />
                                </SelectTrigger>
                            </div>
                        </FormControl>
                        <SelectContent>
                            {availableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                                {room.title}
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
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Cobro</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <div className="relative flex items-center">
                                        <DollarSign className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                        <SelectTrigger className="pl-10">
                                            <SelectValue placeholder="Seleccionar tipo de cobro" />
                                        </SelectTrigger>
                                    </div>
                                </FormControl>
                                <SelectContent>
                                    {Array.from(typePriceMap.entries()).map(([type, price]) => (
                                        <SelectItem key={type} value={type}>
                                            {type} (C${price})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Huésped</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                        <User className="absolute left-3 h-5 w-5 text-muted-foreground" />
                        <Input className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiqueta / Sobrenombre (Opcional)</FormLabel>
                   <FormControl>
                    <div className="relative flex items-center">
                        <Tag className="absolute left-3 h-5 w-5 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Ej: El Ingeniero" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="cedula"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cédula (Opcional)</FormLabel>
                        <FormControl>
                            <div className="relative flex items-center">
                                <Fingerprint className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                <Input className="pl-10" {...field} />
                            </div>
                        </FormControl>
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
                        <FormControl>
                            <div className="relative flex items-center">
                                <Phone className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                <Input className="pl-10" {...field} />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="vehicle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Vehículo (Opcional)</FormLabel>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => field.onChange(field.value === 'car' ? undefined : 'car')} className={cn("h-auto flex-col p-3 border-2", field.value === 'car' ? 'border-primary' : 'border-muted')}><Car className="h-5 w-5" />Carro</Button>
                        <Button type="button" variant="ghost" onClick={() => field.onChange(field.value === 'bike' ? undefined : 'bike')} className={cn("h-auto flex-col p-3 border-2", field.value === 'bike' ? 'border-primary' : 'border-muted')}><Bike className="h-5 w-5" />Moto</Button>
                        <Button type="button" variant="ghost" onClick={() => field.onChange(field.value === 'truck' ? undefined : 'truck')} className={cn("h-auto flex-col p-3 border-2", field.value === 'truck' ? 'border-primary' : 'border-muted')}><Truck className="h-5 w-5" />Camión</Button>
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
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <div className="relative flex items-start">
                        <StickyNote className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Textarea className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 pr-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              {canPerformActions && (
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
