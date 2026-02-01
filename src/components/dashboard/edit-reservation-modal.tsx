'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, UpdateData } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { parseISO, differenceInCalendarDays } from 'date-fns';

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
import { User, Fingerprint, Phone, Tag, StickyNote, Car, Bike, Truck, Home, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reservation, Room } from '@/lib/types';

const roomTypes: Room['type'][] = ["Unipersonal", "Matrimonial", "Doble", "Triple", "Quintuple", "Unipersonal con A/C", "Matrimonial con A/C"];

const editReservationSchema = z.object({
  roomId: z.string({ required_error: "Debe seleccionar una habitación." }),
  type: z.enum(roomTypes, { required_error: 'Debe seleccionar un tipo de cobro.' }),
  guestName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  cedula: z.string().optional(),
  phone: z.string().regex(/^\d{4}-\d{4}$/, { message: "El teléfono debe tener el formato 8888-8888." }).optional().or(z.literal('')),
  nickname: z.string().optional(),
  notes: z.string().optional(),
  vehicle: z.enum(['car', 'bike', 'truck']).optional(),
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

function calculateProratedTotal({
  reservation,
  newType,
  typePriceMap,
  moveDate,
}: {
  reservation: Reservation;
  newType: Room['type'];
  typePriceMap: Map<string, number>;
  moveDate: Date;
}): number {
  const checkIn = parseISO(reservation.checkInDate);
  const checkOut = parseISO(reservation.checkOutDate);
  let totalCost = 0;
  let lastDate = checkIn;

  // Calculate cost for all fully past segments stored in history
  for (const segment of (reservation.roomHistory || [])) {
    if (segment.type) {
      const movedAt = parseISO(segment.movedAt);
      const nights = differenceInCalendarDays(movedAt, lastDate);
      const price = typePriceMap.get(segment.type) || 0;
      if (nights > 0) {
        totalCost += price * nights;
      }
      lastDate = movedAt;
    }
  }

  // Calculate cost for the segment that is ending now
  const nightsInCurrentSegment = differenceInCalendarDays(moveDate, lastDate);
  const currentSegmentPrice = typePriceMap.get(reservation.type) || 0;
  if (nightsInCurrentSegment > 0) {
    totalCost += currentSegmentPrice * nightsInCurrentSegment;
  }

  // Calculate cost for the future part of the stay with the new type
  const futureNights = differenceInCalendarDays(checkOut, moveDate);
  const futurePrice = typePriceMap.get(newType) || 0;
  if (futureNights > 0) {
    totalCost += futurePrice * futureNights;
  }

  const totalNights = differenceInCalendarDays(checkOut, checkIn);
  if (totalNights > 0 && totalCost === 0) {
    return futurePrice * totalNights;
  }
  if (totalNights <= 0) {
    return Math.max(totalCost, futurePrice);
  }

  return totalCost;
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
        let newTotalAmount;
        const consumptionsTotal = reservation.extraConsumptions?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
        
        const hasBillingChanged = data.roomId !== reservation.roomId || data.type !== reservation.type;

        if (hasBillingChanged) {
            const roomTotal = calculateProratedTotal({
                reservation,
                newType: data.type,
                typePriceMap,
                moveDate: new Date(),
            });
            newTotalAmount = roomTotal + consumptionsTotal;
        } else {
            // If room and type didn't change, only other details did. Recalculate simply.
            const nights = differenceInCalendarDays(parseISO(reservation.checkOutDate), parseISO(reservation.checkInDate));
            const priceForType = typePriceMap.get(data.type) || 0;
            const roomTotal = priceForType * (nights > 0 ? nights : 1);
            newTotalAmount = roomTotal + consumptionsTotal;
        }

        const dataToUpdate: UpdateData<Reservation> = {
            guestName: data.guestName,
            cedula: data.cedula,
            phone: data.phone,
            nickname: data.nickname,
            notes: data.notes,
            vehicle: data.vehicle,
            type: data.type,
            'payment.amount': newTotalAmount,
        };

        if (data.roomId !== reservation.roomId) {
            const historyEntry = {
                roomId: reservation.roomId,
                movedAt: new Date().toISOString(),
                type: reservation.type, // Store the type of the segment that just ended
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
        description: 'Los datos del huésped se han guardado correctamente.',
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
