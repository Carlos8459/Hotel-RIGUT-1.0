import { useState } from "react";
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
import { RoomHistoryModal } from "./room-history-modal";
import type { PastGuest } from "./customer-detail-modal";

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
    history?: PastGuest[];
    vehicle?: 'car' | 'bike' | 'truck';
    price?: number;
}

type RoomDetailModalProps = {
    room: Room;
    isOpen: boolean;
    onClose: () => void;
}

const getRoomDescription = (price?: number, roomId?: number) => {
    if (price === undefined || roomId === undefined) return null;
  
    const acRooms = [1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22];
    const isAcEligible = acRooms.includes(roomId);
  
    switch (price) {
      case 400:
        return 'Unipersonal';
      case 500:
        return 'Matrimonial';
      case 700:
        return isAcEligible ? 'Unipersonal con aíre acondicionado' : 'Unipersonal';
      case 800:
        return isAcEligible ? 'Matrimonial con aíre acondicionado' : 'Matrimonial';
      default:
        return null;
    }
  };

export function RoomDetailModal({ room, isOpen, onClose }: RoomDetailModalProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  if (!room) return null;

  const roomDescription = getRoomDescription(room.price, room.id);
  const canCheckout = room.statusText === 'Ocupada';

  function handleCheckout() {
    // Here you would typically handle the checkout logic,
    // like updating the database.
    console.log(`Checking out room ${room.id}`);
    onClose(); // Close the modal after checkout.
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card text-foreground max-w-xs border-border flex flex-col max-h-[85vh] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{room.title}</DialogTitle>
            {roomDescription && <p className="text-base text-muted-foreground -mt-1 mb-1">{roomDescription}</p>}
            <DialogDescription className="text-sm">
              Detalles de la habitación y el huésped actual.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow min-h-0 pr-6 -mr-6">
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Estado</span>
              {room.statusText && <Badge className={`${room.statusColor} text-xs`}>{room.statusText}</Badge>}
            </div>

            {room.guest && !['Próxima Reserva', 'Reservada', 'Mantenimiento'].includes(room.guest) && (
              <>
                <Separator />
                <h3 className="font-semibold text-sm pt-1">Huésped Actual</h3>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="text-xs">{room.guest.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{room.guest}</p>
                    {room.phone && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Phone className="mr-1 h-3 w-3" />
                        <span>{room.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5 pl-10">
                  {room.date && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      <span>{room.date}</span>
                    </div>
                  )}
                  {room.payment && (
                    <div className={`flex items-center text-xs ${room.payment.color}`}>
                      <DollarSign className="mr-1 h-3 w-3" />
                      <span>
                        {room.payment.status}
                        {room.payment.amount && ` (C$${room.payment.amount})`}
                      </span>
                    </div>
                  )}
                  {room.vehicle && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {room.vehicle === 'car' && <Car className="mr-1 h-3 w-3" />}
                      {room.vehicle === 'bike' && <Bike className="mr-1 h-3 w-3" />}
                      {room.vehicle === 'truck' && <Truck className="mr-1 h-3 w-3" />}
                      <span>Vehículo registrado</span>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {room.mainText && (
               <div className="text-center flex-grow flex flex-col justify-center items-center py-4">
                  <p className="text-muted-foreground text-base">{room.mainText}</p>
                </div>
            )}

            {room.history && room.history.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between items-center pt-1">
                  <h3 className="font-semibold text-sm">Historial</h3>
                  <Button variant="link" className="text-xs p-0 h-auto" onClick={() => setIsHistoryModalOpen(true)}>
                    Ver más
                  </Button>
                </div>
                <div className="space-y-1">
                  {room.history.slice(0, 1).map((pastGuest, index) => (
                    <div key={index} className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="text-xs">{pastGuest.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{pastGuest.name}</p>
                        <p className="text-xs text-muted-foreground">{pastGuest.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          </ScrollArea>
          {canCheckout && (
              <div className="pt-2">
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                              <LogOut className="mr-2 h-4 w-4" />
                              Check-out
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[256px] rounded-3xl">
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
      <RoomHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        room={room}
      />
    </>
  );
}
