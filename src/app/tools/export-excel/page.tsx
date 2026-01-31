'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Reservation, Room, Expense, ConsumptionItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';


// Define a user type for the collection data.
type UserDoc = {
    id: string;
    username: string;
    email: string;
    role: string;
};

export default function ExportExcelPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data fetching
    const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);
    const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
    const expensesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
    const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const consumptionItemsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'consumption_items') : null, [firestore]);

    const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);
    const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);
    const { data: expensesData, isLoading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesCollection);
    const { data: usersData, isLoading: usersLoading } = useCollection<UserDoc>(usersCollection);
    const { data: consumptionItemsData, isLoading: consumptionItemsLoading } = useCollection<Omit<ConsumptionItem, 'id'>>(consumptionItemsCollection);

    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleExport = (data: any[], fileName: string, sheetName: string) => {
        setIsExporting(true);
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast({
                title: 'Exportación Exitosa',
                description: `Se han exportado los datos a ${fileName}.xlsx`,
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast({
                title: 'Error de Exportación',
                description: 'No se pudieron exportar los datos.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };
    
    const exportAllData = () => {
        if (!reservationsData || !roomsData || !usersData || !expensesData || !consumptionItemsData) return;
        setIsExporting(true);

        try {
            const workbook = XLSX.utils.book_new();

            // 1. Reservations Sheet
            const roomMap = new Map(roomsData.map(room => [room.id, room]));
            const userMap = new Map(usersData.map(user => [user.id, user.username]));
            const reservationsSheetData = reservationsData.map(res => {
                const room = roomMap.get(res.roomId);
                const creatorName = userMap.get(res.createdBy);
                const nights = differenceInCalendarDays(parseISO(res.checkOutDate), parseISO(res.checkInDate));
                const extraConsumptionsString = res.extraConsumptions?.map(c => `${c.quantity}x ${c.name} (C$${(c.price * c.quantity).toFixed(2)})`).join(', ') || 'Ninguno';

                return {
                    'ID Reserva': res.id,
                    'Huésped': res.guestName,
                    'Cédula': res.cedula,
                    'Teléfono': res.phone,
                    'Check-In': format(parseISO(res.checkInDate), 'yyyy-MM-dd HH:mm'),
                    'Check-Out': format(parseISO(res.checkOutDate), 'yyyy-MM-dd HH:mm'),
                    'Noches': nights,
                    'Habitación': room?.title || 'N/A',
                    'Tipo de Habitación': room?.type || 'N/A',
                    'Vehículo': res.vehicle || 'Ninguno',
                    'Estado Reserva': res.status,
                    'Estado Pago': res.payment?.status || 'N/A',
                    'Monto Total (C$)': res.payment?.amount || 0,
                    'Consumos Extras': extraConsumptionsString,
                    'Fecha Creación': format(parseISO(res.createdAt), 'yyyy-MM-dd HH:mm'),
                    'Creado Por': creatorName || res.createdBy,
                };
            });
            const reservationsWS = XLSX.utils.json_to_sheet(reservationsSheetData);
            XLSX.utils.book_append_sheet(workbook, reservationsWS, 'Reservas');

            // 2. Customers Sheet
            const customerMap: { [key: string]: { name: string; phone?: string; cedula?: string; visits: number; totalSpent: number, lastVisit: string } } = {};
            reservationsData.forEach(res => {
                if (!customerMap[res.guestName]) {
                    customerMap[res.guestName] = {
                        name: res.guestName,
                        phone: res.phone,
                        cedula: res.cedula,
                        visits: 0,
                        totalSpent: 0,
                        lastVisit: '1970-01-01T00:00:00.000Z'
                    };
                }
                const customer = customerMap[res.guestName];
                customer.visits += 1;
                if (res.payment?.status === 'Cancelado') {
                    customer.totalSpent += res.payment.amount || 0;
                }
                if (parseISO(res.checkInDate) > parseISO(customer.lastVisit)) {
                    customer.lastVisit = res.checkInDate;
                    customer.phone = res.phone;
                    customer.cedula = res.cedula;
                }
            });
            const customersSheetData = Object.values(customerMap).map(c => ({
                'Nombre Cliente': c.name,
                'Teléfono': c.phone,
                'Cédula': c.cedula,
                'Número de Visitas': c.visits,
                'Gasto Total (C$)': c.totalSpent,
                'Última Visita': format(parseISO(c.lastVisit), 'yyyy-MM-dd'),
            }));
            const customersWS = XLSX.utils.json_to_sheet(customersSheetData);
            XLSX.utils.book_append_sheet(workbook, customersWS, 'Clientes');

            // 3. Expenses Sheet
            const expensesSheetData = expensesData.map(exp => ({
                'ID Gasto': exp.id,
                'Descripción': exp.description,
                'Monto (C$)': exp.amount,
                'Categoría': exp.category,
                'Fecha Gasto': format(parseISO(exp.date), 'yyyy-MM-dd'),
                'Registrado Por': exp.creatorName,
                'Fecha Registro': format(parseISO(exp.createdAt), 'yyyy-MM-dd HH:mm'),
            }));
            const expensesWS = XLSX.utils.json_to_sheet(expensesSheetData);
            XLSX.utils.book_append_sheet(workbook, expensesWS, 'Gastos');
            
            // 4. Rooms Sheet
            const roomsSheetData = roomsData.map(room => ({
                'ID Habitación': room.id,
                'Título': room.title,
                'Precio (C$)': room.price,
                'Tipo': room.type,
                'Estado': room.status,
            }));
            const roomsWS = XLSX.utils.json_to_sheet(roomsSheetData);
            XLSX.utils.book_append_sheet(workbook, roomsWS, 'Habitaciones');
            
            // 5. Users Sheet
            const usersSheetData = usersData.map(user => ({
                'ID Usuario': user.id,
                'Nombre de Usuario': user.username,
                'Correo': user.email,
                'Rol': user.role,
            }));
            const usersWS = XLSX.utils.json_to_sheet(usersSheetData);
            XLSX.utils.book_append_sheet(workbook, usersWS, 'Socios');

            // 6. Consumption Items Sheet
            const consumptionItemsSheetData = consumptionItemsData.map(item => ({
                'ID Consumo': item.id,
                'Nombre': item.name,
                'Precio (C$)': item.price,
                'Icono': item.icon,
            }));
            const consumptionItemsWS = XLSX.utils.json_to_sheet(consumptionItemsSheetData);
            XLSX.utils.book_append_sheet(workbook, consumptionItemsWS, 'Consumos');

            // Write file
            XLSX.writeFile(workbook, `Reporte_Completo_Hotel_RIGUT_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: 'Exportación Completa Exitosa',
                description: `Se han exportado todos los datos.`,
            });

        } catch (error) {
            console.error('Error exporting all data to Excel:', error);
            toast({
                title: 'Error de Exportación',
                description: 'No se pudieron exportar todos los datos.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const exportAllReservations = () => {
        if (!reservationsData || !roomsData || !usersData) return;

        const roomMap = new Map(roomsData.map(room => [room.id, room]));
        const userMap = new Map(usersData.map(user => [user.id, user.username]));

        const flattenedData = reservationsData.map(res => {
            const room = roomMap.get(res.roomId);
            const creatorName = userMap.get(res.createdBy);
            const nights = differenceInCalendarDays(parseISO(res.checkOutDate), parseISO(res.checkInDate));
            const extraConsumptionsString = res.extraConsumptions?.map(c => `${c.quantity}x ${c.name} (C$${(c.price * c.quantity).toFixed(2)})`).join(', ') || 'Ninguno';

            return {
                'ID Reserva': res.id,
                'Huésped': res.guestName,
                'Cédula': res.cedula,
                'Teléfono': res.phone,
                'Check-In': format(parseISO(res.checkInDate), 'yyyy-MM-dd HH:mm'),
                'Check-Out': format(parseISO(res.checkOutDate), 'yyyy-MM-dd HH:mm'),
                'Noches': nights,
                'Habitación': room?.title || 'N/A',
                'Tipo de Habitación': room?.type || 'N/A',
                'Vehículo': res.vehicle || 'Ninguno',
                'Estado Reserva': res.status,
                'Estado Pago': res.payment?.status || 'N/A',
                'Monto Total (C$)': res.payment?.amount || 0,
                'Consumos Extras': extraConsumptionsString,
                'Fecha Creación': format(parseISO(res.createdAt), 'yyyy-MM-dd HH:mm'),
                'Creado Por': creatorName || res.createdBy,
            };
        });

        handleExport(flattenedData, 'Reservas', 'Reservas');
    };

    const exportAllCustomers = () => {
         if (!reservationsData) return;

        const customerMap: { [key: string]: { name: string; phone?: string; cedula?: string; visits: number; totalSpent: number, lastVisit: string } } = {};
        
        reservationsData.forEach(res => {
            if (!customerMap[res.guestName]) {
                customerMap[res.guestName] = {
                    name: res.guestName,
                    phone: res.phone,
                    cedula: res.cedula,
                    visits: 0,
                    totalSpent: 0,
                    lastVisit: '1970-01-01T00:00:00.000Z'
                };
            }
            const customer = customerMap[res.guestName];
            customer.visits += 1;
            if (res.payment?.status === 'Cancelado') {
                customer.totalSpent += res.payment.amount || 0;
            }
            if (parseISO(res.checkInDate) > parseISO(customer.lastVisit)) {
                customer.lastVisit = res.checkInDate;
                customer.phone = res.phone; // update with latest phone
                customer.cedula = res.cedula; // update with latest cedula
            }
        });

        const flattenedData = Object.values(customerMap).map(c => ({
            'Nombre Cliente': c.name,
            'Teléfono': c.phone,
            'Cédula': c.cedula,
            'Número de Visitas': c.visits,
            'Gasto Total (C$)': c.totalSpent,
            'Última Visita': format(parseISO(c.lastVisit), 'yyyy-MM-dd'),
        }));

        handleExport(flattenedData, 'Clientes', 'Clientes');
    };

    const exportAllExpenses = () => {
        if (!expensesData) return;
        const flattenedData = expensesData.map(exp => ({
            'ID Gasto': exp.id,
            'Descripción': exp.description,
            'Monto (C$)': exp.amount,
            'Categoría': exp.category,
            'Fecha Gasto': format(parseISO(exp.date), 'yyyy-MM-dd'),
            'Registrado Por': exp.creatorName,
            'Fecha Registro': format(parseISO(exp.createdAt), 'yyyy-MM-dd HH:mm'),
        }));
        handleExport(flattenedData, 'Gastos', 'Gastos');
    };

    const isLoading = isUserLoading || reservationsLoading || roomsLoading || expensesLoading || usersLoading || consumptionItemsLoading;

    if (isLoading) {
        return (
            <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
                 <header className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-7 w-48" />
                </header>
                <main className="max-w-2xl mx-auto space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </main>
            </div>
        );
    }
    
    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div className="flex-grow flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Exportar Datos a Excel</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto space-y-4">
                <Button
                    onClick={exportAllData}
                    disabled={isExporting || isLoading}
                    className="w-full justify-start text-base h-auto py-4"
                >
                    <Download className="mr-3 h-5 w-5" />
                    Exportar Todo (Reporte Completo)
                </Button>
                
                <Separator className="my-6" />

                <Button
                    onClick={exportAllReservations}
                    disabled={isExporting || isLoading}
                    className="w-full justify-start text-base h-auto py-4"
                    variant="outline"
                >
                    <Download className="mr-3 h-5 w-5" />
                    Exportar Solo Reservas
                </Button>
                <Button
                    onClick={exportAllCustomers}
                    disabled={isExporting || isLoading}
                    className="w-full justify-start text-base h-auto py-4"
                    variant="outline"
                >
                    <Download className="mr-3 h-5 w-5" />
                    Exportar Solo Clientes
                </Button>
                <Button
                    onClick={exportAllExpenses}
                    disabled={isExporting || isLoading}
                    className="w-full justify-start text-base h-auto py-4"
                    variant="outline"
                >
                    <Download className="mr-3 h-5 w-5" />
                    Exportar Solo Gastos
                </Button>
            </main>
        </div>
    );
}
