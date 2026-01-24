'use client';

import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Plus, Minus, X, Utensils, GlassWater, Droplet, Droplets, Beer, Coffee, Sandwich, CakeSlice, IceCream, Package } from 'lucide-react';
import { updateDoc, collection, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Reservation, ExtraConsumption, ConsumptionItem } from '@/lib/types';


type ExtraConsumptionModalProps = {
  reservation: Reservation | undefined;
  roomPrice: number;
  isOpen: boolean;
  onClose: () => void;
};

const consumptionIcons: { [key: string]: React.ReactNode } = {
    Utensils: <Utensils className="h-5 w-5" />,
    GlassWater: <GlassWater className="h-5 w-5" />,
    Droplet: <Droplet className="h-5 w-5" />,
    Droplets: <Droplets className="h-5 w-5" />,
    Beer: <Beer className="h-5 w-5" />,
    Coffee: <Coffee className="h-5 w-5" />,
    Sandwich: <Sandwich className="h-5 w-5" />,
    CakeSlice: <CakeSlice className="h-5 w-5" />,
    IceCream: <IceCream className="h-5 w-5" />,
    Package: <Package className="h-5 w-5" />,
};

export function ExtraConsumptionModal({ reservation, roomPrice, isOpen, onClose }: ExtraConsumptionModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [consumptions, setConsumptions] = useState<ExtraConsumption[]>([]);

  const consumptionItemsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'consumption_items') : null, [firestore]);
  const { data: consumptionItemsData, isLoading: consumptionItemsLoading } = useCollection<Omit<ConsumptionItem, 'id'>>(consumptionItemsCollection);


  useEffect(() => {
    if (consumptionItemsLoading || !isOpen) return;

    const availableItems = consumptionItemsData || [];
    const currentConsumptions = reservation?.extraConsumptions || [];
    
    // Initialize state with a full list of items, merging current consumptions
    const initialItems = availableItems.map(predefined => {
      const current = currentConsumptions.find(c => c.name === predefined.name);
      return current ? { ...current, price: predefined.price, icon: predefined.icon } : { ...predefined, quantity: 0, id: predefined.id };
    });

    // Also include items that might have been saved to a reservation but since deleted from the main list
    const oldCustomItems = currentConsumptions
      .filter(c => !availableItems.some(p => p.name === c.name))
      .map(c => ({...c, icon: c.icon || 'Package'}));
    
    const sortedItems = [...initialItems, ...oldCustomItems].sort((a,b) => a.name.localeCompare(b.name));

    setConsumptions(sortedItems as ExtraConsumption[]);

  }, [isOpen, reservation, consumptionItemsData, consumptionItemsLoading]);


  const handleQuantityChange = (itemName: string, delta: number) => {
    setConsumptions(prev =>
      prev.map(item =>
        item.name === itemName
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  };

  const handleSaveChanges = async () => {
    if (!firestore || !reservation) return;

    const resDocRef = doc(firestore, 'reservations', reservation.id);
    const updatedConsumptions = consumptions
      .filter(c => c.quantity > 0)
      .map(({ name, price, quantity, icon }) => ({ name, price, quantity, icon }));

    const nights = differenceInCalendarDays(parseISO(reservation.checkOutDate), parseISO(reservation.checkInDate));
    const roomTotal = roomPrice * (nights > 0 ? nights : 1);
    const consumptionsTotal = updatedConsumptions.reduce((total, item) => total + (item.price * item.quantity), 0);
    const newTotalAmount = roomTotal + consumptionsTotal;

    try {
      await updateDoc(resDocRef, { 
        extraConsumptions: updatedConsumptions,
        'payment.amount': newTotalAmount,
       });
      toast({
        title: 'Consumos Actualizados',
        description: 'Se han guardado los cambios y el total ha sido recalculado.',
      });
      onClose();
    } catch (error) {
      console.error("Error updating consumptions:", error);
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl">
        <DialogHeader>
          <DialogTitle>Consumos Extras</DialogTitle>
          <DialogDescription>
            Agrega o modifica los productos consumidos por el huésped.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-4 py-4 pr-2">
            {consumptionItemsLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            ) : consumptions.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <span className="text-muted-foreground">{consumptionIcons[item.icon] || <Package className="h-5 w-5" />}</span>
                    <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">C${item.price.toFixed(2)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, -1)}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.name, 1)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                </div>
            ))}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
