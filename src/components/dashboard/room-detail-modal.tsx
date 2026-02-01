import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, updateDoc } from 'firebase/firestore';
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
import { Calendar as CalendarIcon, DollarSign, Phone, Car, Bike, Truck, LogOut, History, User, Pencil, Wrench, Trash2, ShoppingCart, Utensils, GlassWater, Droplet, Droplets, Beer, Coffee, Sandwich, CakeSlice, IceCream, Package, StickyNote } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomHistoryModal } from "./room-history-modal";
import { ExtraConsumptionModal } from "./extra-consumption-modal";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import type { ProcessedRoom } from "@/app/dashboard/page";
import type { Room, Reservation, ExtraConsumption } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const formatPhoneNumberForDisplay = (phone: string | undefined) => {
    if (!phone) return '';
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length === 8) {
      return `${digitsOnly.substring(0, 4)}-${digitsOnly.substring(4)}`;
    }
    return phone;
};

type RoomDetailModalProps = {
    room: ProcessedRoom;
    isOpen: boolean;
    onClose: () => void;
}

const consumptionIcons: { [key: string]: React.ReactNode } = {
    Utensils: <Utensils className="h-4 w-4" />,
    GlassWater: <GlassWater className="h-4 w-4" />,
    Droplet: <Droplet className="h-4 w-4" />,
    Droplets: <Droplets className="h-4 w-4" />,
    Beer: <Beer className="h-4 w-4" />,
    Coffee: <Coffee className="h-4 w-4" />,
    Sandwich: <Sandwich className="h-4 w-4" />,
    CakeSlice: <CakeSlice className="h-4 w-4" />,
    IceCream: <IceCream className="h-4 w-4" />,
    Package: <Package className="h-4 w-4" />,
};

export function RoomDetailModal({ room, isOpen, onClose }: RoomDetailModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  
  if (!room) return null;

  const getStayDate = (reservation?: Reservation) => {
      if (!reservation) return null;
      const checkIn = parseISO(reservation.checkInDate);
      const checkOut = parseISO(reservation.checkOutDate);
      const nights = differenceInCalendarDays(checkOut, checkIn);
      return `${format(checkIn, 'd LLL', {locale: es})} - ${format(checkOut, 'd LLL', {locale: es})} (${nights} ${nights === 1 ? 'noche' : 'noches'})`;
  }

  const handleDeleteReservation = async (reservationId: string) => {
      if (!firestore || !reservationId) return;
      const reservationDocRef = doc(firestore, 'reservations', reservationId);
      await deleteDocumentNonBlocking(reservationDocRef);
      toast({
          title: 'Reservación Eliminada',
          description: 'La reservación ha sido eliminada y la habitación está ahora disponible.',
      });
      onClose();
  };

  const handleAction = async (reservationId: string, action: 'checkout' | 'confirm_payment') => {
      if (!firestore) return;
      const resDocRef = doc(firestore, 'reservations', reservationId);
      
      let dataToUpdate = {};
      if (action === 'checkout') {
          dataToUpdate = { status: 'Checked-Out' };
      } else if (action === 'confirm_payment') {
          dataToUpdate = { 'payment.status': 'Cancelado' };
      }

      await updateDocumentNonBlocking(resDocRef, dataToUpdate);
      onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card text-foreground sm:max-w-md border-border flex flex-col max-h-[90vh] rounded-3xl p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">{room.title}</DialogTitle>
                <p className="text-base text-muted-foreground">{room.type}</p>
              </div>
              <Badge className={`${room.statusColor} text-sm`}>{room.statusText}</Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-grow min-h-0 px-6">
            <div className="space-y-6 pb-6">
                {['Ocupada', 'Check-out Pendiente', 'Checkout Vencido'].includes(room.statusText) && room.reservation && (
                    <>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center"><User className="mr-2 h-5 w-5" />Huésped</h3>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-2xl">{room.reservation.guestName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="font-semibold text-lg">{room.reservation.guestName}</p>
                                {room.reservation.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="mr-2 h-4 w-4" />
                                    <span>{formatPhoneNumberForDisplay(room.reservation.phone)}</span>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                     <Separator />
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center"><CalendarIcon className="mr-2 h-5 w-5" />Estadía</h3>
                        <div className="grid gap-2 text-sm">
                            <div className="flex items-center text-muted-foreground">
                                <span className="w-28 font-medium text-foreground">Duración:</span>
                                <span>{getStayDate(room.reservation)}</span>
                            </div>
                            {room.reservation.payment && (
                                <div className={`flex items-center`}>
                                    <span className="w-28 font-medium text-foreground">Pago:</span>
                                    <span className={room.reservation.payment.status === 'Pendiente' ? 'text-red-400' : 'text-green-400'}>
                                        {room.reservation.payment.status}
                                        {room.reservation.payment.amount && ` (C$${room.reservation.payment.amount})`}
                                    </span>
                                </div>
                            )}
                            {room.reservation.vehicle && (
                                <div className="flex items-center text-muted-foreground">
                                    <span className="w-28 font-medium text-foreground">Vehículo:</span>
                                    <div className="flex items-center">
                                        {room.reservation.vehicle === 'car' && <Car className="mr-2 h-4 w-4" />}
                                        {room.reservation.vehicle === 'bike' && <Bike className="mr-2 h-4 w-4" />}
                                        {room.reservation.vehicle === 'truck' && <Truck className="mr-2 h-4 w-4" />}
                                        <span>
                                            {room.reservation.vehicle === 'car' ? 'Carro' : room.reservation.vehicle === 'bike' ? 'Moto' : 'Camión'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {room.reservation.notes && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center"><StickyNote className="mr-2 h-5 w-5" />Notas</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{room.reservation.notes}</p>
                            </div>
                        </>
                    )}
                    </>
                )}

                {room.reservation?.extraConsumptions && room.reservation.extraConsumptions.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center"><ShoppingCart className="mr-2 h-5 w-5" />Consumos</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {room.reservation.extraConsumptions.map(item => (
                                    <div key={item.name} className="flex items-center text-muted-foreground">
                                        {consumptionIcons[item.icon] || <Package className="h-4 w-4" />}
                                        <span className="ml-2 mr-1 font-medium text-foreground">{item.quantity}x</span>
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            
                {(room.statusText === 'Disponible' || room.statusText === 'Mantenimiento' || room.statusText === 'No Disponible') && (
                    <div className="text-center flex-grow flex flex-col justify-center items-center py-8">
                        {room.statusText === 'Disponible' && <p className="text-muted-foreground text-lg">Limpia y lista</p>}
                        {room.statusText === 'Mantenimiento' && <p className="text-muted-foreground text-lg flex items-center"><Wrench className="mr-2 h-5 w-5"/>En Mantenimiento</p>}
                        {room.statusText === 'No Disponible' && <p className="text-muted-foreground text-lg flex items-center"><BedDouble className="mr-2 h-5 w-5"/>No Disponible</p>}
                    </div>
                )}

            </div>
          </ScrollArea>
          
          {['Ocupada', 'Check-out Pendiente', 'Checkout Vencido'].includes(room.statusText) && room.reservation && (
              <div className="p-6 pt-2 mt-auto">
                    <Button variant="outline" className="w-full text-base py-6 mb-4" onClick={() => setIsConsumptionModalOpen(true)}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Consumos Extras
                    </Button>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full text-base py-6">
                              <LogOut className="mr-2 h-5 w-5" />
                              Realizar Check-out
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro de hacer check-out?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción marcará la habitación como disponible y finalizará la estadía del huésped. No podrás deshacer esta acción.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleAction(room.reservation!.id, 'checkout')}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
          )}
        </DialogContent>
      </Dialog>

      <ExtraConsumptionModal
        isOpen={isConsumptionModalOpen}
        onClose={() => setIsConsumptionModalOpen(false)}
        reservation={room.reservation}
        roomPrice={room.price}
      />
    </>
  );
}
