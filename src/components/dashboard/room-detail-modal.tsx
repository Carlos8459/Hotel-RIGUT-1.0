import { useState, useEffect, ReactNode, useMemo } from "react";
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

const roomTypes: Room['type'][] = ["Unipersonal", "Matrimonial", "Doble", "Triple", "Quintuple", "Unipersonal con A/C", "Matrimonial con A/C"];

export function RoomDetailModal({ room, isOpen, onClose, allRooms, allReservations, userProfile }: RoomDetailModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusToChange, setStatusToChange] = useState<Room['status'] | null>(null);
  const [isConfirmStatusDialogOpen, setIsConfirmStatusDialogOpen] = useState(false);

  const notificationConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'notification_config') : null, [firestore]);
  const { data: notificationConfig } = useDoc<Omit<NotificationConfig, 'id'>>(notificationConfigRef);
  
  const typePriceMap = useMemo(() => {
    const customPrices: Record<Room['type'], number> = {
        "Unipersonal": 400,
        "Matrimonial": 500,
        "Doble": 600,
        "Triple": 700,
        "Quintuple": 1000,
        "Unipersonal con A/C": 700,
        "Matrimonial con A/C": 800,
    };
    const map = new Map<string, number>();
    roomTypes.forEach(type => map.set(type, customPrices[type]));
    return map;
  }, []);

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
  
    const handleStatusChange = (newStatus: Room['status']) => {
        if (!firestore || !canChangeStatus || !user || !userProfile?.username) return;
        const roomDocRef = doc(firestore, 'rooms', room.id);
        
        updateDocumentNonBlocking(roomDocRef, { status: newStatus })
            .then(() => {
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
            });
    };

    const handleStatusSelect = (newStatus: Room['status']) => {
      setStatusToChange(newStatus);
      setIsConfirmStatusDialogOpen(true);
    };

    const handleConfirmStatusChange = () => {
        if (statusToChange) {
            handleStatusChange(statusToChange);
        }
        setIsConfirmStatusDialogOpen(false);
        setStatusToChange(null);
    };
  
    const priceForReservation = room.reservation ? (typePriceMap.get(room.reservation.type) || room.price) : room.price;


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
            {isRoomOccupied && room.reservation && (
            <div className="flex items-center gap-3 pt-4">
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
            )}
          </DialogHeader>

          <ScrollArea className="flex-grow min-h-0 px-6">
            <div className="space-y-4 pb-6">
                {isRoomOccupied && room.reservation && (
                    <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm pt-2">
                        <div className="flex items-start col-span-full">
                            <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground">Estadía</p>
                                <p className="text-muted-foreground">{getStayDate(room.reservation)}</p>
                            </div>
                        </div>

                        {room.reservation.payment && (
                            <div className="flex items-start">
                                <DollarSign className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground">Pago</p>
                                    <p className={room.reservation.payment.status === 'Pendiente' ? 'text-red-400' : 'text-green-400'}>
                                        {room.reservation.payment.status}
                                        {room.reservation.payment.amount && ` (C$${room.reservation.payment.amount})`}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {room.reservation.vehicle && (
                            <div className="flex items-start">
                                <Car className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground">Vehículo</p>
                                    <p className="text-muted-foreground">
                                        {room.reservation.vehicle === 'car' ? 'Carro' : room.reservation.vehicle === 'bike' ? 'Moto' : 'Camión'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {room.reservation.roomHistory && room.reservation.roomHistory.length > 0 && (
                        <>
                        <Separator/>
                        <div className="space-y-2 pt-2">
                            <h3 className="font-semibold text-base flex items-center"><History className="mr-2 h-4 w-4" />Historial de Hab.</h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                                {room.reservation.roomHistory.map((historyItem, index) => {
                                    const pastRoom = allRooms.find(r => r.id === historyItem.roomId);
                                    return <p key={index}>{pastRoom?.title || historyItem.roomId} (hasta {format(parseISO(historyItem.movedAt), 'd LLL yy', {locale: es})})</p>
                                })}
                            </div>
                        </div>
                        </>
                    )}

                    {room.reservation.notes && (
                        <>
                            <Separator />
                            <div className="space-y-2 pt-2">
                                <h3 className="font-semibold text-base flex items-center"><StickyNote className="mr-2 h-4 w-4" />Notas</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{room.reservation.notes}</p>
                            </div>
                        </>
                    )}

                    {room.reservation.extraConsumptions && room.reservation.extraConsumptions.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3 pt-2">
                                <h3 className="font-semibold text-base flex items-center"><ShoppingCart className="mr-2 h-4 w-4" />Consumos</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
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
                     {room.reservation.payment?.status === 'Pendiente' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="secondary" className="w-full">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Registrar Pago
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-xs rounded-3xl">
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar pago?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción marcará la cuenta de {room.reservation.guestName} como pagada.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction(room.reservation!.id, 'confirm_payment')}>Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <LogOut className="mr-2 h-4 w-4" />
                                Realizar Check-out
                            </Button>
                        </AlertDialogTrigger>
                        {room.reservation.payment?.status === 'Pendiente' ? (
                             <AlertDialogContent className="max-w-xs rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Pago Pendiente</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Primero se debe cancelar la cuenta para proceder con el check-out.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogAction>Entendido</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        ) : (
                            <AlertDialogContent className="max-w-xs rounded-3xl">
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
                        )}
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
                        <DropdownMenuItem onSelect={() => handleStatusSelect('Disponible')}>Disponible</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusSelect('Limpieza Pendiente')}>Limpieza Pendiente</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusSelect('Mantenimiento')}>Mantenimiento</DropdownMenuItem>
                        {userProfile?.role !== 'Colaborador' && (
                            <>
                                <Separator />
                                <DropdownMenuItem onSelect={() => handleStatusSelect('No Disponible')}>No Disponible</DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmStatusDialogOpen} onOpenChange={setIsConfirmStatusDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esto cambiará el estado de la habitación <strong>{room.title}</strong> a <strong>{statusToChange}</strong>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStatusToChange(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmStatusChange}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
      
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
        roomPrice={priceForReservation}
        userProfile={userProfile}
      />
    </>
  );
}
