import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, updateDoc, deleteField } from 'firebase/firestore';
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
import { RoomHistoryModal } from "./room-history-modal";
import { ExtraConsumptionModal } from "./extra-consumption-modal";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ProcessedRoom } from "@/app/dashboard/page";
import type { Room, Reservation, ExtraConsumption } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";

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

type EditableGuestData = {
    name: string;
    cedula: string;
    phone: string;
    roomId: string;
    vehicle?: 'car' | 'bike' | 'truck';
    checkOutDate: Date | undefined;
    notes: string;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [editedGuest, setEditedGuest] = useState<EditableGuestData>({
    name: "",
    cedula: "",
    phone: "",
    roomId: "",
    vehicle: undefined,
    checkOutDate: undefined,
    notes: "",
  });

  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
  const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);
  
  if (!room) return null;

  const getStayDate = (reservation?: Reservation) => {
      if (!reservation) return null;
      const checkIn = parseISO(reservation.checkInDate);
      const checkOut = parseISO(reservation.checkOutDate);
      const nights = differenceInCalendarDays(checkOut, checkIn);
      return `${format(checkIn, 'd LLL', {locale: es})} - ${format(checkOut, 'd LLL', {locale: es})} (${nights} ${nights === 1 ? 'noche' : 'noches'})`;
  }

  const handleDeleteReservation = (reservationId: string) => {
      if (!firestore || !reservationId) return;
      const reservationDocRef = doc(firestore, 'reservations', reservationId);
      deleteDocumentNonBlocking(reservationDocRef).then(() => {
          toast({
              title: 'Reservación Eliminada',
              description: 'La reservación ha sido eliminada y la habitación está ahora disponible.',
          });
          onClose();
      });
  };

  const handleAction = (reservationId: string, action: 'checkout' | 'confirm_payment') => {
      if (!firestore) return;
      const resDocRef = doc(firestore, 'reservations', reservationId);
      
      let dataToUpdate = {};
      if (action === 'checkout') {
          dataToUpdate = { status: 'Checked-Out' };
      } else if (action === 'confirm_payment') {
          dataToUpdate = { 'payment.status': 'Cancelado' };
      }

      updateDocumentNonBlocking(resDocRef, dataToUpdate)
        .then(() => {
          onClose();
        })
        .catch(error => {
          console.error(`Error performing action ${action}:`, error);
        });
  };
  
  const handleOpenEditModal = () => {
    if (!room.reservation) return;
    setEditedGuest({
      name: room.reservation.guestName,
      phone: room.reservation.phone || '',
      cedula: room.reservation.cedula || '',
      roomId: room.reservation.roomId,
      vehicle: room.reservation.vehicle,
      checkOutDate: parseISO(room.reservation.checkOutDate),
      notes: room.reservation.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = () => {
    if (!firestore || !room.reservation?.id) return;
    
    const resDocRef = doc(firestore, 'reservations', room.reservation.id);
    
    const updatedData: { [key: string]: any } = {
        guestName: editedGuest.name,
        cedula: editedGuest.cedula,
        phone: editedGuest.phone,
        roomId: editedGuest.roomId,
        checkOutDate: editedGuest.checkOutDate?.toISOString(),
        notes: editedGuest.notes,
        vehicle: editedGuest.vehicle ? editedGuest.vehicle : deleteField(),
    };

    Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined) {
            delete updatedData[key];
        }
    });

    updateDocumentNonBlocking(resDocRef, updatedData)
        .then(() => {
            toast({ title: "Cambios guardados", description: "La información de la estadía ha sido actualizada." });
            setIsEditModalOpen(false);
            onClose();
        })
        .catch(error => {
            console.error("Error updating reservation:", error);
            toast({ title: 'Error', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
        });
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
                <Badge className={`${room.statusColor} text-sm mr-6`}>{room.statusText}</Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-grow min-h-0 px-6">
            <div className="space-y-6 pb-6">
                {room.statusText === 'Ocupada' && room.reservation && (
                    <>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg flex items-center"><User className="mr-2 h-5 w-5" />Huésped</h3>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={handleOpenEditModal}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar datos del cliente</span>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                            <span className="sr-only">Eliminar reservación</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar Reservación?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Se eliminará permanentemente la reservación y la habitación quedará disponible.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => handleDeleteReservation(room.reservation!.id)}>
                                                Eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
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
            
                {(room.statusText === 'Disponible' || room.statusText === 'Mantenimiento') && (
                    <div className="text-center flex-grow flex flex-col justify-center items-center py-4">
                        {room.statusText === 'Disponible' && <p className="text-muted-foreground text-lg">Limpia y lista</p>}
                        {room.statusText === 'Mantenimiento' && <p className="text-muted-foreground text-lg flex items-center"><Wrench className="mr-2 h-5 w-5"/>En Mantenimiento</p>}
                    </div>
                )}

            </div>
          </ScrollArea>
          
          {room.statusText === 'Ocupada' && room.reservation && (
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
                      <AlertDialogContent className="max-w-xs rounded-3xl">
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

       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Editar Datos de Estadía</DialogTitle>
                <DialogDescription>
                    Realiza cambios en la información del huésped y su estadía.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                <div className="space-y-4 py-4 px-1">
                    <div className="space-y-2">
                        <Label htmlFor="guest-name">Nombre del Huésped</Label>
                        <Input 
                            id="guest-name" 
                            value={editedGuest.name}
                            onChange={(e) => setEditedGuest(prev => ({...prev, name: e.target.value}))}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="guest-cedula">Cédula</Label>
                        <Input 
                            id="guest-cedula" 
                            placeholder="001-000000-0000X"
                            value={editedGuest.cedula}
                            onChange={(e) => setEditedGuest(prev => ({...prev, cedula: e.target.value}))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guest-phone">Teléfono</Label>
                        <Input
                            id="guest-phone"
                            placeholder="8888-8888"
                            value={editedGuest.phone}
                            onChange={(e) => {
                                const input = e.target.value;
                                const digitsOnly = input.replace(/[^0-9]/g, '');
                                if (digitsOnly.length <= 8) {
                                    let formatted = digitsOnly;
                                    if (digitsOnly.length > 4) {
                                        formatted = `${digitsOnly.substring(0, 4)}-${digitsOnly.substring(4)}`;
                                    }
                                    setEditedGuest(prev => ({...prev, phone: formatted}));
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="room-select">Cambiar Habitación</Label>
                        <Select
                            value={editedGuest.roomId}
                            onValueChange={(value) => setEditedGuest(prev => ({...prev, roomId: value}))}
                        >
                            <SelectTrigger id="room-select">
                                <SelectValue placeholder="Seleccionar habitación" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={String(room.id)}>{room.title} (Actual)</SelectItem>
                                {roomsData
                                    ?.filter(r => r.status === 'Disponible')
                                    .map(r => (
                                        <SelectItem key={r.id} value={String(r.id)}>{r.title} - {r.type}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vehicle-select">Tipo de Vehículo</Label>
                        <Select
                            value={editedGuest.vehicle || ''}
                            onValueChange={(value) => setEditedGuest(prev => ({...prev, vehicle: value === 'none' ? undefined : value as 'car' | 'bike' | 'truck'}))}
                        >
                            <SelectTrigger id="vehicle-select">
                                <SelectValue placeholder="Seleccionar vehículo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                <SelectItem value="car">Carro</SelectItem>
                                <SelectItem value="bike">Moto</SelectItem>
                                <SelectItem value="truck">Camión</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Extender Estadía (Fecha de Check-out)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !editedGuest.checkOutDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editedGuest.checkOutDate ? format(editedGuest.checkOutDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={editedGuest.checkOutDate}
                                    onSelect={(date) => setEditedGuest(prev => ({...prev, checkOutDate: date as Date | undefined}))}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="guest-notes">Notas Adicionales</Label>
                        <Textarea
                            id="guest-notes"
                            placeholder="Anotaciones sobre el huésped..."
                            value={editedGuest.notes}
                            onChange={(e) => setEditedGuest(prev => ({...prev, notes: e.target.value}))}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
