import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, Calendar, DollarSign, Phone, Car, Bike, Truck } from "lucide-react";
import { Separator } from "../ui/separator";

export type PastGuest = {
    name: string;
    date: string;
    avatar: string;
    phone?: string;
    payment?: {
        status: string;
        amount?: number;
    };
    vehicle?: 'car' | 'bike' | 'truck';
    roomTitle?: string;
};

type CustomerDetailModalProps = {
    guest: PastGuest | null;
    isOpen: boolean;
    onClose: () => void;
    showRoom?: boolean;
};

export function CustomerDetailModal({ guest, isOpen, onClose, showRoom = false }: CustomerDetailModalProps) {
  if (!guest) return null;

  const paymentColor = guest.payment?.status === 'Cancelado' ? 'text-green-400' : 'text-red-400';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground max-w-xs border-border rounded-3xl">
        <DialogHeader>
          <DialogTitle>Detalles del Huésped</DialogTitle>
          <DialogDescription>
            Información detallada del huésped anterior.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarFallback>{guest.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg">{guest.name}</p>
                 {guest.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    <span>{guest.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-base">Detalles de la Estadía</h3>
                {showRoom && guest.roomTitle && (
                  <div className="flex items-center text-muted-foreground">
                    <Home className="mr-2 h-4 w-4" />
                    <span>{guest.roomTitle}</span>
                  </div>
                )}
                <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{guest.date}</span>
                </div>
                 {guest.vehicle && (
                    <div className="flex items-center text-muted-foreground">
                    {guest.vehicle === 'car' && <Car className="mr-2 h-4 w-4" />}
                    {guest.vehicle === 'bike' && <Bike className="mr-2 h-4 w-4" />}
                    {guest.vehicle === 'truck' && <Truck className="mr-2 h-4 w-4" />}
                    <span>
                        Vehículo: {guest.vehicle === 'car' ? 'Carro' : guest.vehicle === 'bike' ? 'Moto' : 'Camión'}
                    </span>
                    </div>
                )}
                {guest.payment && (
                    <div className={`flex items-center ${paymentColor}`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>
                        {guest.payment.status}
                        {guest.payment.amount && ` (C$${guest.payment.amount})`}
                    </span>
                    </div>
                )}
            </div>
            
        </div>
      </DialogContent>
    </Dialog>
  );
}

    