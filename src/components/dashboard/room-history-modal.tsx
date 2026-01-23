import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Car, Bike, Truck } from "lucide-react";
import { CustomerDetailModal } from "./customer-detail-modal";
import type { Customer, Reservation, Room } from "@/lib/types";

type RoomHistoryModalProps = {
    room: Room;
    history: Reservation[];
    isOpen: boolean;
    onClose: () => void;
}

export function RoomHistoryModal({ room, history, isOpen, onClose }: RoomHistoryModalProps) {
  const [selectedGuest, setSelectedGuest] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  if (!room) return null;

  const handleGuestClick = (guestName: string) => {
    // This requires a more complex lookup if we want full customer details.
    // For now, we don't have a direct way to create a 'Customer' object here.
    // This modal's functionality might need to be re-evaluated.
    console.log("Clicked on guest:", guestName);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card text-foreground max-w-sm border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle>Historial de {room.title}</DialogTitle>
            <DialogDescription>
              Mostrando el historial completo de la habitación.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-4 py-4">
              {history.length > 0 ? (
                  history.map((pastReservation, index) => (
                    <div key={index}>
                      <div onClick={() => handleGuestClick(pastReservation.guestName)} className="cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                  <Avatar className="h-9 w-9 mr-4">
                                    <AvatarFallback>{pastReservation.guestName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold">{pastReservation.guestName}</p>
                                    <p className="text-sm text-muted-foreground">{pastReservation.checkInDate}</p>
                                  </div>
                              </div>
                              {pastReservation.vehicle && (
                                  <div className="text-muted-foreground">
                                      {pastReservation.vehicle === 'car' && <Car className="h-5 w-5" />}
                                      {pastReservation.vehicle === 'bike' && <Bike className="h-5 w-5" />}
                                      {pastReservation.vehicle === 'truck' && <Truck className="h-5 w-5" />}
                                  </div>
                              )}
                          </div>
                      </div>
                      {index < history.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))
              ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                      No hay historial para esta habitación.
                  </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* {selectedGuest && <CustomerDetailModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedGuest}
      />} */}
    </>
  );
}
