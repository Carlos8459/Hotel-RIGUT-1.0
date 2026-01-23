
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
import { Calendar, DollarSign, Phone } from "lucide-react";

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
}

type RoomDetailModalProps = {
    room: Room;
    isOpen: boolean;
    onClose: () => void;
}

export function RoomDetailModal({ room, isOpen, onClose }: RoomDetailModalProps) {
  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground sm:max-w-[425px] border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">{room.title}</DialogTitle>
          <DialogDescription>
            Detalles de la habitación y el huésped actual.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
                    Pago: {room.payment.status}
                    {room.payment.amount && ` ($${room.payment.amount})`}
                  </span>
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
              <div className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
}
