import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, Phone, Car, Bike, Truck, LogOut, History, User, Pencil } from "lucide-react";
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
import { getRoomDescription } from "@/lib/hotel-data";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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

export function RoomDetailModal({ room, isOpen, onClose }: RoomDetailModalProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedGuest, setEditedGuest] = useState({ name: '', phone: '' });

  if (!room) return null;

  const roomDescription = getRoomDescription(room.price, room.id);
  const canCheckout = room.statusText === 'Ocupada' || room.statusText === 'Acomodada';
  const isGuestPresent = room.guest && !['Próxima Reserva', 'Reservada', 'Mantenimiento'].includes(room.guest);

  function handleCheckout() {
    // Here you would typically handle the checkout logic,
    // like updating the database.
    console.log(`Checking out room ${room.id}`);
    onClose(); // Close the modal after checkout.
  }
  
  const handleOpenEditModal = () => {
    setEditedGuest({ name: room.guest || '', phone: room.phone || '' });
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = () => {
    console.log("Saving changes for guest:", editedGuest);
    // This is where you would update the database with the new guest info.
    // For now, it just closes the modal as the dashboard data is static.
    setIsEditModalOpen(false);
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card text-foreground sm:max-w-md border-border flex flex-col max-h-[90vh] rounded-3xl p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
                <div>
                    <DialogTitle className="text-2xl font-bold">{room.title}</DialogTitle>
                    {roomDescription && <p className="text-base text-muted-foreground">{roomDescription}</p>}
                </div>
                {room.statusText && <Badge className={`${room.statusColor} text-sm`}>{room.statusText}</Badge>}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-grow min-h-0 px-6">
            <div className="space-y-6 pb-6">
                {isGuestPresent && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg flex items-center"><User className="mr-2 h-5 w-5" />Huésped</h3>
                            <Button variant="ghost" size="icon" onClick={handleOpenEditModal}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar datos del cliente</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-2xl">{room.guest!.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="font-semibold text-lg">{room.guest}</p>
                                {room.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="mr-2 h-4 w-4" />
                                    <span>{room.phone}</span>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {(isGuestPresent || room.date) && <Separator />}

                {isGuestPresent && (
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center"><Calendar className="mr-2 h-5 w-5" />Estadía</h3>
                        <div className="grid gap-2 text-sm">
                            {room.date && (
                                <div className="flex items-center text-muted-foreground">
                                    <span className="w-28 font-medium text-foreground">Duración:</span>
                                    <span>{room.date}</span>
                                </div>
                            )}
                            {room.payment && (
                                <div className={`flex items-center`}>
                                    <span className="w-28 font-medium text-foreground">Pago:</span>
                                    <span className={room.payment.color}>
                                        {room.payment.status}
                                        {room.payment.amount && ` (C$${room.payment.amount})`}
                                    </span>
                                </div>
                            )}
                            {room.vehicle && (
                                <div className="flex items-center text-muted-foreground">
                                    <span className="w-28 font-medium text-foreground">Vehículo:</span>
                                    <div className="flex items-center">
                                        {room.vehicle === 'car' && <Car className="mr-2 h-4 w-4" />}
                                        {room.vehicle === 'bike' && <Bike className="mr-2 h-4 w-4" />}
                                        {room.vehicle === 'truck' && <Truck className="mr-2 h-4 w-4" />}
                                        <span>
                                            {room.vehicle === 'car' ? 'Carro' : room.vehicle === 'bike' ? 'Moto' : 'Camión'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            
                {room.mainText && (
                <div className="text-center flex-grow flex flex-col justify-center items-center py-4">
                    <p className="text-muted-foreground text-lg">{room.mainText}</p>
                    </div>
                )}

                {room.history && room.history.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg flex items-center"><History className="mr-2 h-5 w-5" />Historial Reciente</h3>
                                <Button variant="link" className="text-sm p-0 h-auto" onClick={() => setIsHistoryModalOpen(true)}>
                                    Ver todo
                                </Button>
                            </div>
                            <div className="space-y-3">
                            {room.history.slice(0, 2).map((pastGuest, index) => (
                                <div key={index} className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                    <AvatarFallback>{pastGuest.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{pastGuest.name}</p>
                                    <p className="text-xs text-muted-foreground">{pastGuest.date}</p>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
          </ScrollArea>
          
          {canCheckout && (
              <div className="p-6 pt-0 mt-auto">
                   <Separator className="mb-4" />
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full text-base py-6">
                              <LogOut className="mr-2 h-5 w-5" />
                              Realizar Check-out
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-xs rounded-3xl">
                          <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro de hacer check-out?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción marcará la habitación como disponible y finalizará la estadía del huésped. No podrás deshacer esta acción.
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
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Editar Datos del Huésped</DialogTitle>
                <DialogDescription>
                    Realiza cambios en la información del huésped. Haz clic en guardar cuando termines.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guest-name" className="text-right">
                        Nombre
                    </Label>
                    <Input 
                        id="guest-name" 
                        value={editedGuest.name}
                        onChange={(e) => setEditedGuest(prev => ({...prev, name: e.target.value}))}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guest-phone" className="text-right">
                        Teléfono
                    </Label>
                    <Input 
                        id="guest-phone" 
                        value={editedGuest.phone}
                        onChange={(e) => setEditedGuest(prev => ({...prev, phone: e.target.value}))}
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
