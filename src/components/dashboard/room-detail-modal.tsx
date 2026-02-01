import { useState, useEffect, ReactNode } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
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
import { Calendar as CalendarIcon, DollarSign, Phone, Car, Bike, Truck, LogOut, History, User, Pencil, Wrench, Trash2, ShoppingCart, Utensils, GlassWater, Droplet, Droplets, Beer, Coffee, Sandwich, CakeSlice, IceCream, Package, StickyNote, BedDouble, Wand2 } from "lucide-react";
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
import { EditReservationModal } from "./edit-reservation-modal";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import type { ProcessedRoom } from "@/app/dashboard/page";
import type { Room, Reservation, ExtraConsumption, NotificationConfig } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const formatPhoneNumberForDisplay = (phone: string | undefined) => {
    if (!phone) return '';
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length === 8) {
      return `${digitsOnly.substring(0, 4)}-${digitsOnly.substring(4)}`;
    }
    return phone;
};

type UserProfile = {
    username: string;
    role: 'Admin' | 'Socio' | 'Colaborador';
    permissions: { 
        manageCustomers?: boolean;
        [key: string]: boolean | undefined;
    };
} | null | undefined;


type RoomDetailModalProps = {
    room: ProcessedRoom;
    isOpen: boolean;
    onClose: () => void;
    allRooms: Room[];
    allReservations: Reservation[];
    userProfile: UserProfile;
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

export function RoomDetailModal({ room, isOpen, onClose, allRooms, allReservations, userProfile }: RoomDetailModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const notificationConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'notification_config') : null, [firestore]);
  const { data: notificationConfig } = useDoc<Omit<NotificationConfig, 'id'>>(notificationConfigRef);
  
  if (!room) return null;
  
  const canPerformActions = userProfile && userProfile.role !== 'Colaborador';
  const canChangeStatus = userProfile && ['Admin', 'Socio', 'Colaborador'].includes(userProfile.role);
  const isRoomOccupied = ['Ocupada', 'Check-out Pendiente', 'Checkout Vencido'].includes(room.statusText);

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
          const roomDocRef = doc(firestore, 'rooms', room.id);
          await updateDocumentNonBlocking(roomDocRef, { status: 'Limpieza Pendiente' });
      } else if (action === 'confirm_payment') {
          dataToUpdate = { 'payment.status': 'Cancelado' };
      }

      await updateDocumentNonBlocking(resDocRef, dataToUpdate);
      onClose();
  };
  
    const handleStatusChange = async (newStatus: Room['status']) => {
        if (!firestore || !canChangeStatus || !user || !userProfile?.username) return;
        const roomDocRef = doc(firestore, 'rooms', room.id);
        try {
            await updateDocumentNonBlocking(roomDocRef, { status: newStatus });
            
            if (notificationConfig?.isEnabled) {
                const notificationsColRef = collection(firestore, 'notifications');
                addDocumentNonBlocking(notificationsColRef, {
                    message: `cambió el estado de la habitación ${room.title} a "${newStatus}".`,
                    createdAt: new Date().toISOString(),
                    createdBy: user.uid,
                    creatorName: userProfile.username,
                    isRead: false,
                    roomId: room.id,
                    type: 'info' as const,
                });
            }

            toast({
                title: 'Estado Actualizado',
                description: `La habitación ${room.title} ahora está: ${newStatus}.`,
            });
            onClose();
        } catch (error) {
            console.error("Error updating room status:", error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el estado de la habitación.',
                variant: 'destructive',
            });
        }
    };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card text-foreground sm:max-w-md border-border flex flex-col max-h-[90vh] rounded-3xl p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <DialogTitle className="text-2xl font-bold">{room.title}</DialogTitle>
                    <Badge className={`${room.statusColor} text-sm`}>{room.statusText}</Badge>
                </div>
            </div>
            <p className="text-base text-muted-foreground">{room.type}</p>
          </DialogHeader>

          <ScrollArea className="flex-grow min-h-0 px-6">
            <div className="space-y-4 pb-6">
                {isRoomOccupied && room.reservation && (
                    <>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>{room.reservation.guestName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow space-y-0.5">
                            <p className="font-semibold">{room.reservation.guestName}</p>
                            {room.reservation.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="mr-2 h-4 w-4" />
                                <span>{formatPhoneNumberForDisplay(room.reservation.phone)}</span>
                            </div>
                            )}
                        </div>
                        <div className="flex items-center">
                            {canPerformActions && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditModalOpen(true)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {canPerformActions && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar Reserva?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción eliminará permanentemente la reserva de <strong>{room.reservation.guestName}</strong>. Esta acción no se puede deshacer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteReservation(room.reservation!.id)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                     <Separator />
                     <div className="space-y-3">
                        <h3 className="font-semibold text-base flex items-center"><CalendarIcon className="mr-2 h-4 w-4" />Estadía</h3>
                        <div className="grid gap-1.5 text-sm pl-6">
                            <div className="flex items-center text-muted-foreground">
                                <span className="w-24 font-medium text-foreground">Duración:</span>
                                <span>{getStayDate(room.reservation)}</span>
                            </div>
                            {room.reservation.payment && (
                                <div className={`flex items-center`}>
                                    <span className="w-24 font-medium text-foreground">Pago:</span>
                                    <span className={room.reservation.payment.status === 'Pendiente' ? 'text-red-400' : 'text-green-400'}>
                                        {room.reservation.payment.status}
                                        {room.reservation.payment.amount && ` (C$${room.reservation.payment.amount})`}
                                    </span>
                                </div>
                            )}
                            {room.reservation.vehicle && (
                                <div className="flex items-center text-muted-foreground">
                                    <span className="w-24 font-medium text-foreground">Vehículo:</span>
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
                    {room.reservation.roomHistory && room.reservation.roomHistory.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="font-semibold text-base flex items-center"><History className="mr-2 h-4 w-4" />Historial de Habitaciones</h3>
                                <div className="grid gap-1.5 text-sm pl-6">
                                    {room.reservation.roomHistory.map((historyItem, index) => {
                                        const pastRoom = allRooms.find(r => r.id === historyItem.roomId);
                                        return (
                                            <div key={index} className="flex items-center text-muted-foreground">
                                                <span>{pastRoom?.title || historyItem.roomId} (hasta {format(parseISO(historyItem.movedAt), 'd LLL yy', {locale: es})})</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                    {room.reservation.notes && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-base flex items-center"><StickyNote className="mr-2 h-4 w-4" />Notas</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">{room.reservation.notes}</p>
                            </div>
                        </>
                    )}
                    </>
                )}

                {room.reservation?.extraConsumptions && room.reservation.extraConsumptions.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <h3 className="font-semibold text-base flex items-center"><ShoppingCart className="mr-2 h-4 w-4" />Consumos</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm pl-6">
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
            
                {!isRoomOccupied && (
                    <div className="text-center flex-grow flex flex-col justify-center items-center py-8">
                        {room.statusText === 'Disponible' && <p className="text-muted-foreground text-lg">Limpia y lista</p>}
                        {room.statusText === 'Mantenimiento' && <p className="text-muted-foreground text-lg flex items-center"><Wrench className="mr-2 h-5 w-5"/>En Mantenimiento</p>}
                        {room.statusText === 'Limpieza Pendiente' && <p className="text-muted-foreground text-lg flex items-center"><Droplets className="mr-2 h-5 w-5"/>Limpieza Pendiente</p>}
                        {room.statusText === 'No Disponible' && <p className="text-muted-foreground text-lg flex items-center"><BedDouble className="mr-2 h-5 w-5"/>No Disponible</p>}
                    </div>
                )}

            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 pt-2 mt-auto">
            {isRoomOccupied && canPerformActions && room.reservation ? (
                <div className="w-full space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => setIsConsumptionModalOpen(true)}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Consumos Extras
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <LogOut className="mr-2 h-4 w-4" />
                                Realizar Check-out
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro de hacer check-out?</AlertDialogTitle>
                            <AlertDialogDescription>
                                La habitación pasará a estado de "Limpieza Pendiente".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAction(room.reservation!.id, 'checkout')}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ) : !isRoomOccupied && canChangeStatus ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="w-full">
                            <Wand2 className="mr-2 h-4 w-4" />
                            Cambiar Estado
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuItem onSelect={() => handleStatusChange('Disponible')}>Disponible</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusChange('Limpieza Pendiente')}>Limpieza Pendiente</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusChange('Mantenimiento')}>Mantenimiento</DropdownMenuItem>
                        {userProfile?.role !== 'Colaborador' && (
                            <>
                                <Separator />
                                <DropdownMenuItem onSelect={() => handleStatusChange('No Disponible')}>No Disponible</DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
        </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {room.reservation && (
        <EditReservationModal
            reservation={room.reservation}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            allRooms={allRooms}
            allReservations={allReservations}
            userProfile={userProfile}
        />
      )}

      <ExtraConsumptionModal
        isOpen={isConsumptionModalOpen}
        onClose={() => setIsConsumptionModalOpen(false)}
        reservation={room.reservation}
        roomPrice={room.price}
        userProfile={userProfile}
      />
    </>
  );
}
