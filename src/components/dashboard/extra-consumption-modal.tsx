'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Minus, X, Utensils, CupSoda, Bottle, PlusCircle } from 'lucide-react';
import { updateDoc } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ExtraConsumption } from '@/lib/types';

// Predefined items with prices
const PREDEFINED_ITEMS: Omit<ExtraConsumption, 'quantity'>[] = [
  { name: 'Comida', price: 150 },
  { name: 'Gaseosa', price: 30 },
  { name: 'Agua 1L', price: 25 },
  { name: 'Agua 2L', price: 40 },
];

type ExtraConsumptionModalProps = {
  reservationId: string | undefined;
  currentConsumptions: ExtraConsumption[];
  isOpen: boolean;
  onClose: () => void;
};

export function ExtraConsumptionModal({ reservationId, currentConsumptions, isOpen, onClose }: ExtraConsumptionModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [consumptions, setConsumptions] = useState<ExtraConsumption[]>([]);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  useEffect(() => {
    // Initialize state with a full list of items, merging current consumptions
    const initialItems = PREDEFINED_ITEMS.map(predefined => {
      const current = currentConsumptions.find(c => c.name === predefined.name);
      return current ? current : { ...predefined, quantity: 0 };
    });

    // Add any custom items from current consumptions that are not in the predefined list
    const customItems = currentConsumptions.filter(c => !PREDEFINED_ITEMS.some(p => p.name === c.name));
    setConsumptions([...initialItems, ...customItems]);

  }, [isOpen, currentConsumptions]);


  const handleQuantityChange = (itemName: string, delta: number) => {
    setConsumptions(prev =>
      prev.map(item =>
        item.name === itemName
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  };
  
  const handleAddCustomItem = () => {
    if (customItemName && customItemPrice) {
      const price = parseFloat(customItemPrice);
      if (!isNaN(price) && !consumptions.some(c => c.name === customItemName)) {
        setConsumptions(prev => [...prev, { name: customItemName, price, quantity: 1 }]);
        setCustomItemName('');
        setCustomItemPrice('');
      } else {
         toast({ title: 'Error', description: 'El artículo ya existe o el precio no es válido.', variant: 'destructive' });
      }
    }
  };
  
  const handleRemoveCustomItem = (itemName: string) => {
      setConsumptions(prev => prev.filter(item => item.name !== itemName));
  }

  const handleSaveChanges = async () => {
    if (!firestore || !reservationId) return;

    const resDocRef = doc(firestore, 'reservations', reservationId);
    const updatedConsumptions = consumptions.filter(c => c.quantity > 0);

    try {
      await updateDoc(resDocRef, { extraConsumptions: updatedConsumptions });
      toast({
        title: 'Consumos Actualizados',
        description: 'Se han guardado los cambios correctamente.',
      });
      onClose();
    } catch (error) {
      console.error("Error updating consumptions:", error);
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
    }
  };

  const consumptionIcons: { [key: string]: React.ReactNode } = {
    'Comida': <Utensils className="h-5 w-5" />,
    'Gaseosa': <CupSoda className="h-5 w-5" />,
    'Agua 1L': <Bottle className="h-5 w-5" />,
    'Agua 2L': <Bottle className="h-5 w-5" />,
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
            {consumptions.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <span className="text-muted-foreground">{consumptionIcons[item.name] || <Utensils className="h-5 w-5" />}</span>
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
                    {!PREDEFINED_ITEMS.some(p => p.name === item.name) && (
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveCustomItem(item.name)}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                </div>
            ))}

            <div className="pt-6 space-y-4 border-t mt-4">
                 <h4 className="font-semibold">Agregar nuevo servicio</h4>
                 <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-3">
                         <Label htmlFor="custom-item-name" className="sr-only">Nombre</Label>
                         <Input id="custom-item-name" placeholder="Nombre del servicio" value={customItemName} onChange={e => setCustomItemName(e.target.value)} />
                    </div>
                     <div className="col-span-2">
                        <Label htmlFor="custom-item-price" className="sr-only">Precio</Label>
                        <Input id="custom-item-price" type="number" placeholder="Precio" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} />
                    </div>
                    <Button className="col-span-1" type="button" onClick={handleAddCustomItem} size="icon">
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                 </div>
            </div>
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
