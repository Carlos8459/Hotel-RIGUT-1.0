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
import { Calendar as CalendarIcon, DollarSign, Phone, Car, Bike, Truck, LogOut, History, User, Pencil } from "lucide-react";
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
import { getRoomDescription, roomsData } from "@/lib/hotel-data";
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
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Room = {
    id: number;
    title: string;
    guest?: string;
    phone?: string;
    cedula?: string;
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
  const [editedGuest, setEditedGuest] = useState({
    name: "",
    cedula: "",
    phone: "",
    roomId: "",
    vehicle: undefined as 'car' | 'bike' | 'truck' | undefined,
    checkOutDate: undefined as Date | undefined,
  });

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
    const parseCheckoutDate = (dateStr?: string): Date | undefined => {
        if (!dateStr) return undefined;
        try {
            const currentYear = new Date().getFullYear();
            const datePart = dateStr.split(' - ')[1]?.split(' (')[0];
            if (!datePart) return undefined;
            return parse(`${datePart} ${currentYear}`, 'd LLL yyyy', { locale: es });
        } catch (e) {
            console.error("Error parsing checkout date:", e)
            return undefined;
        }
    };

    setEditedGuest({
      name: room.guest || '',
      phone: room.phone || '',
      cedula: room.cedula || '',
      roomId: String(room.id),
      vehicle: room.vehicle,
      checkOutDate: parseCheckoutDate(room.date),
    });
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = () => {
    console.log("Saving changes:", editedGuest);
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
                        <h3 className="font-semibold text-lg flex items-center"><CalendarIcon className="mr-2 h-5 w-5" />Estadía</h3>
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
                            value={editedGuest.phone}
                            onChange={(e) => setEditedGuest(prev => ({...prev, phone: e.target.value}))}
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
                                    .filter(r => r.statusText === 'Disponible')
                                    .map(r => (
                                        <SelectItem key={r.id} value={String(r.id)}>{r.title} - {getRoomDescription(r.price, r.id)}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vehicle-select">Tipo de Vehículo</Label>
                        <Select
                            value={editedGuest.vehicle}
                            onValueChange={(value: 'car' | 'bike' | 'truck') => setEditedGuest(prev => ({...prev, vehicle: value}))}
                        >
                            <SelectTrigger id="vehicle-select">
                                <SelectValue placeholder="Seleccionar vehículo" />
                            </SelectTrigger>
                            <SelectContent>
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
                                    onSelect={(date) => setEditedGuest(prev => ({...prev, checkOutDate: date as Date}))}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
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
