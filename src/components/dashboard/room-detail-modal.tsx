import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, Phone, Car, Bike, Truck, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";

type Room = {
    id: number;
    title: string;
    guest?: string;
    phone?: string;
    statusText?: string;
    statusColor?: string;
    date?: string;
    payment?: {
        status: string;
        amount?: number;
        color: string;
    };
    mainText?: string;
    history?: {
        name: string;
        date: string;
        avatar: string;
    }[];
    vehicle?: 'car' | 'bike' | 'truck';
    price?: number;
}

type RoomDetailModalProps = {
    room: Room;
    isOpen: boolean;
    onClose: () => void;
}

const getRoomDescription = (price?: number) => {
    if (!price) return null;
    switch (price) {
        case 400: return 'Unipersonal';
        case 500: return 'Matrimonial';
        case 700: return 'Unipersonal con aíre acondicionado';
        case 800: return 'Matrimonial con aíre acondicionado';
        default: return null;
    }
}

export function RoomDetailModal({ room, isOpen, onClose }: RoomDetailModalProps) {
  if (!room) return null;

  const roomDescription = getRoomDescription(room.price);
  const canCheckout = room.statusText === 'Ocupada';

  function handleCheckout() {
    // Here you would typically handle the checkout logic,
    // like updating the database.
    console.log(`Checking out room ${room.id}`);
    onClose(); // Close the modal after checkout.
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground max-w-xs border-border flex flex-col max-h-[85vh] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{room.title}</DialogTitle>
          {roomDescription && <p className="text-lg text-muted-foreground -mt-1 mb-2">{roomDescription}</p>}
          <DialogDescription>
            Detalles de la habitación y el huésped actual.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-6 -mr-6">
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estado</span>
            {room.statusText && <Badge className={room.statusColor}>{room.statusText}</Badge>}
          </div>

          {room.guest && !['Próxima Reserva', 'Reservada', 'Mantenimiento'].includes(room.guest) && (
            <>
              <Separator />
              <h3 className="font-semibold">Huésped Actual</h3>
              <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-4">
                  <AvatarFallback>{room.guest.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{room.guest}</p>
                  {room.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="mr-2 h-4 w-4" />
                      <span>{room.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              {room.date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{room.date}</span>
                </div>
              )}
              {room.payment && (
                 <div className={`flex items-center text-sm ${room.payment.color}`}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>
                    {room.payment.status}
                    {room.payment.amount && ` (C$${room.payment.amount})`}
                  </span>
                </div>
              )}
              {room.vehicle && (
                <div className="flex items-center text-sm text-muted-foreground">
                  {room.vehicle === 'car' && <Car className="mr-2 h-4 w-4" />}
                  {room.vehicle === 'bike' && <Bike className="mr-2 h-4 w-4" />}
                  {room.vehicle === 'truck' && <Truck className="mr-2 h-4 w-4" />}
                  <span>Vehículo registrado</span>
                </div>
              )}
            </>
          )}
          
          {room.mainText && (
             <div className="text-center flex-grow flex flex-col justify-center items-center py-8">
                <p className="text-muted-foreground text-lg">{room.mainText}</p>
              </div>
          )}

          {room.history && room.history.length > 0 && (
            <>
              <Separator />
              <h3 className="font-semibold">Historial de Huéspedes</h3>
              <div className="space-y-6">
                {room.history.map((pastGuest, index) => (
                  <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9 mr-4">
                      <AvatarFallback>{pastGuest.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{pastGuest.name}</p>
                      <p className="text-sm text-muted-foreground">{pastGuest.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        </ScrollArea>
        {canCheckout && (
            <div className="pt-6">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Check-out
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[320px] rounded-3xl">
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de hacer check-out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción marcará la habitación como disponible. No podrás deshacer esta acción.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCheckout}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

    