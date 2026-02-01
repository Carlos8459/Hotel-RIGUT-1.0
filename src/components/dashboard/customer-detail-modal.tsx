import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, Calendar, DollarSign, Phone, Car, Bike, Truck, StickyNote, QrCode, Edit, Save } from "lucide-react";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import type { Customer, Reservation, CustomerProfile } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, writeBatch, collection, query, where, getDocs } from "firebase/firestore";
import { useState } from "react";

type UserProfile = {
    role: 'Admin' | 'Socio' | 'Colaborador';
    permissions?: { manageCustomers?: boolean };
} | null | undefined;

type CustomerDetailModalProps = {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    roomMap: Map<string, string>;
    userProfile: UserProfile;
};

export function CustomerDetailModal({ customer, isOpen, onClose, roomMap, userProfile }: CustomerDetailModalProps) {
  const firestore = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(customer?.name || '');

  const customerProfileRef = useMemoFirebase(() => (
    firestore && customer?.cedula)
    ? doc(firestore, 'customers', customer.cedula.replace(/-/g, ''))
    : null,
  [firestore, customer]);

  const { data: customerProfile } = useDoc<CustomerProfile>(customerProfileRef);

  const canEditCustomer = userProfile && (userProfile.role === 'Admin' || userProfile.permissions?.manageCustomers);

  const handleSave = async () => {
    if (!firestore || !customer || !name.trim() || name.trim() === customer.name || !canEditCustomer) {
        setIsEditing(false);
        return;
    }

    const newName = name.trim();
    const batch = writeBatch(firestore);

    if (customer.cedula) {
        const customerDocRef = doc(firestore, 'customers', customer.cedula.replace(/-/g, ''));
        batch.update(customerDocRef, { name: newName });
    }

    const reservationsRef = collection(firestore, 'reservations');
    const q = query(reservationsRef, where("cedula", "==", customer.cedula));

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { guestName: newName });
        });

        await batch.commit();
        onClose();
    } catch (error) {
        console.error("Error updating customer name:", error);
    } finally {
        setIsEditing(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsEditing(false); onClose();} }}>
      <DialogContent className="bg-card text-foreground max-w-sm border-border rounded-3xl p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Detalles del Cliente</DialogTitle>
           <div className="flex items-center pt-4">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarFallback>{customer.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                {isEditing ? (
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-lg font-bold"
                    />
                ) : (
                    <p className="font-bold text-lg">{customer.name}</p>
                )}
                 {customer.phone && (
                  <div className="flex items-center text-sm text-foreground/80 mt-1">
                    <Phone className="mr-2 h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                {canEditCustomer && (
                    isEditing ? (
                        <Button onClick={handleSave} size="icon" variant="default">
                            <Save className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={() => { setIsEditing(true); setName(customer.name); }} size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                        </Button>
                    )
                )}
              </div>
            </div>
        </DialogHeader>

        {customerProfile?.rawIdData && (
          <div className="px-6 pb-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  Ver Datos de Escaneo QR
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Datos Crudos del Escaneo QR</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta es la información completa extraída del código QR de la cédula.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 p-4 bg-muted rounded-md text-xs font-mono break-words max-h-60 overflow-y-auto">
                  {customerProfile.rawIdData}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cerrar</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <Separator />
        <ScrollArea className="flex-grow min-h-0 px-6">
            <h3 className="font-semibold text-base mb-4 pt-4">Historial de Visitas ({customer.visitCount})</h3>
            <div className="space-y-4 pb-6">
                {customer.history.map((visit, index) => {
                    const paymentColor = visit.payment?.status === 'Cancelado' ? 'text-green-400' : 'text-red-400';
                    const dateRange = `${format(parseISO(visit.checkInDate), "d LLL yy", {locale: es})} - ${format(parseISO(visit.checkOutDate), "d LLL yy", {locale: es})}`

                    return (
                        <div key={index} className="space-y-2 text-sm p-3 rounded-lg border bg-background/50">
                             <div className="flex items-center text-foreground font-semibold">
                                <Home className="mr-2 h-4 w-4" />
                                <span>{roomMap.get(visit.roomId) || `Habitación ${visit.roomId}`}</span>
                             </div>
                            <div className="flex items-center text-foreground/80">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>{dateRange}</span>
                            </div>
                             {visit.vehicle && (
                                <div className="flex items-center text-foreground/80">
                                {visit.vehicle === 'car' && <Car className="mr-2 h-4 w-4" />}
                                {visit.vehicle === 'bike' && <Bike className="mr-2 h-4 w-4" />}
                                {visit.vehicle === 'truck' && <Truck className="mr-2 h-4 w-4" />}
                                <span>
                                    Vehículo: {visit.vehicle === 'car' ? 'Carro' : visit.vehicle === 'bike' ? 'Moto' : 'Camión'}
                                </span>
                                </div>
                            )}
                            {visit.payment && (
                                <div className={`flex items-center ${paymentColor}`}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                <span>
                                    {visit.payment.status}
                                    {visit.payment.amount && ` (C$${visit.payment.amount})`}
                                </span>
                                </div>
                            )}
                             {visit.notes && (
                                <div className="flex items-start pt-2 text-foreground/80 border-t border-dashed mt-2">
                                    <StickyNote className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
                                    <p className="text-sm">{visit.notes}</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
