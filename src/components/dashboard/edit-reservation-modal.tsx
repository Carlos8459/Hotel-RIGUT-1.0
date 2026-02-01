'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

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
import { User, Fingerprint, Phone, Tag, StickyNote, Car, Bike, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reservation } from '@/lib/types';

const editReservationSchema = z.object({
  guestName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  cedula: z.string().optional(),
  phone: z.string().regex(/^\d{4}-\d{4}$/, { message: "El teléfono debe tener el formato 8888-8888." }).optional().or(z.literal('')),
  nickname: z.string().optional(),
  notes: z.string().optional(),
  vehicle: z.enum(['car', 'bike', 'truck']).optional(),
});

type EditReservationModalProps = {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
};

export function EditReservationModal({ reservation, isOpen, onClose }: EditReservationModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof editReservationSchema>>({
    resolver: zodResolver(editReservationSchema),
    defaultValues: {
      guestName: '',
      cedula: '',
      phone: '',
      nickname: '',
      notes: '',
      vehicle: undefined,
    },
  });

  useEffect(() => {
    if (reservation) {
      form.reset({
        guestName: reservation.guestName,
        cedula: reservation.cedula || '',
        phone: reservation.phone || '',
        nickname: reservation.nickname || '',
        notes: reservation.notes || '',
        vehicle: reservation.vehicle,
      });
    }
  }, [reservation, form, isOpen]);

  const onSubmit = async (data: z.infer<typeof editReservationSchema>) => {
    if (!firestore) return;
    setIsSaving(true);

    const resDocRef = doc(firestore, 'reservations', reservation.id);

    try {
      await updateDocumentNonBlocking(resDocRef, data);
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
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
