'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO, differenceInCalendarDays, isWithinInterval, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileSpreadsheet, Calendar as CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Reservation, Room, Expense, ConsumptionItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Define a user type for the collection data.
type UserDoc = {
    id: string;
    username: string;
    email: string;
    role: string;
};


function DateRangePicker({
  className,
  date,
  onDateChange,
}: {
  className?: string;
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full sm:w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'd LLL, y', { locale: es })} -{' '}
                  {format(date.to, 'd LLL, y', { locale: es })}
                </>
              ) : (
                format(date.from, 'd LLL, y', { locale: es })
              )
            ) : (
              <span>Seleccione un rango</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}


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
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    // Date preset functions
    const setToday = () => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) });
    const setThisWeek = () => setDateRange({ from: startOfWeek(new Date(), { locale: es }), to: endOfWeek(new Date(), { locale: es }) });
    const setThisMonth = () => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    const setLastMonth = () => {
        const lastMonth = subMonths(new Date(), 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    };
    const setThisYear = () => setDateRange({ from: startOfYear(new Date()), to: endOfYear(new Date()) });
    
    // Memoized filtered data
    const filteredReservations = useMemo(() => {
        if (!reservationsData) return [];
        if (!dateRange?.from) return reservationsData as Reservation[];
        const endOfRange = dateRange.to ?? dateRange.from;
        return reservationsData.filter(res => {
            const checkOutDate = parseISO(res.checkOutDate);
            return isWithinInterval(checkOutDate, { start: dateRange.from!, end: endOfRange });
        }) as Reservation[];
    }, [reservationsData, dateRange]);

    const filteredExpenses = useMemo(() => {
        if (!expensesData) return [];
        if (!dateRange?.from) return expensesData as Expense[];
        const endOfRange = dateRange.to ?? dateRange.from;
        return expensesData.filter(exp => {
            const expenseDate = parseISO(exp.date);
            return isWithinInterval(expenseDate, { start: dateRange.from!, end: endOfRange });
        });
    }, [expensesData, dateRange]);


    const handleExport = (sheets: { data: any[], name: string }[], fileName: string) => {
        setIsExporting(true);
        try {
            const workbook = XLSX.utils.book_new();
            sheets.forEach(sheet => {
                const worksheet = XLSX.utils.json_to_sheet(sheet.data);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
            });

            XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
        if (!roomsData || !usersData || !consumptionItemsData || !reservationsData || !expensesData) {
            toast({ title: 'Datos Incompletos', description: 'Algunos datos aún se están cargando. Intenta de nuevo en un momento.', variant: 'destructive' });
            return;
        }

        const roomMap = new Map(roomsData.map(room => [room.id, room]));
        const userMap = new Map(usersData.map(user => [user.id, user.username]));

        const paidReservations = filteredReservations.filter(res => res.payment?.status === 'Cancelado');

        const reservationsSheetData = paidReservations.map(res => {
            const room = roomMap.get(res.roomId);
            const nights = differenceInCalendarDays(parseISO(res.checkOutDate), parseISO(res.checkInDate));
            const consumptionTotal = res.extraConsumptions?.reduce((acc, c) => acc + c.price * c.quantity, 0) || 0;
            const roomTotal = (res.payment?.amount || 0) - consumptionTotal;

            return {
                'ID Reserva': res.id,
                'Huésped': res.guestName,
                'Cédula': res.cedula || '',
                'Teléfono': res.phone || '',
                'Check-In': format(parseISO(res.checkInDate), 'yyyy-MM-dd HH:mm'),
                'Check-Out': format(parseISO(res.checkOutDate), 'yyyy-MM-dd HH:mm'),
                'Noches': nights > 0 ? nights : 0,
                'Habitación': room?.title || 'N/A',
                'Tipo de Cobro': res.type,
                'Ingresos por Habitación (C$)': roomTotal,
                'Ingresos por Consumos (C$)': consumptionTotal,
                'Monto Total (C$)': res.payment?.amount || 0,
                'Creado Por': userMap.get(res.createdBy) || res.createdBy,
                'Notas': res.notes || '',
            };
        });
        
        const totalRoomIncome = reservationsSheetData.reduce((acc, row) => acc + row['Ingresos por Habitación (C$)'], 0);
        const totalConsumptionIncome = reservationsSheetData.reduce((acc, row) => acc + row['Ingresos por Consumos (C$)'], 0);
        const grandTotalIncome = reservationsSheetData.reduce((acc, row) => acc + row['Monto Total (C$)'], 0);
        
        reservationsSheetData.push({});
        reservationsSheetData.push({
            'Huésped': 'TOTALES',
            'Ingresos por Habitación (C$)': totalRoomIncome,
            'Ingresos por Consumos (C$)': totalConsumptionIncome,
            'Monto Total (C$)': grandTotalIncome,
        });

        const expensesSheetData = filteredExpenses.map(exp => ({
            'ID Gasto': exp.id,
            'Descripción': exp.description,
            'Monto (C$)': exp.amount,
            'Categoría': exp.category,
            'Fecha Gasto': format(parseISO(exp.date), 'yyyy-MM-dd'),
            'Registrado Por': userMap.get(exp.createdBy) || exp.creatorName,
        }));
        
        const totalExpenses = expensesSheetData.reduce((acc, row) => acc + row['Monto (C$)'], 0);
        expensesSheetData.push({});
        expensesSheetData.push({
            'Descripción': 'TOTAL GASTOS',
            'Monto (C$)': totalExpenses,
        });

        const summarySheetData = [
            { 'Métrica': 'Total Ingresos Brutos', 'Valor (C$)': grandTotalIncome },
            { 'Métrica': 'Total Gastos', 'Valor (C$)': totalExpenses },
            { 'Métrica': 'Ingreso Neto (Ganancia)', 'Valor (C$)': grandTotalIncome - totalExpenses },
            { 'Métrica': '', 'Valor (C$)': '' },
            { 'Métrica': 'Ingresos por Habitación', 'Valor (C$)': totalRoomIncome },
            { 'Métrica': 'Ingresos por Consumos Extra', 'Valor (C$)': totalConsumptionIncome },
        ];
        
        const customerMap: { [key: string]: { name: string; phone?: string; cedula?: string; visits: number; totalSpent: number, lastVisit: string } } = {};
        filteredReservations.forEach(res => {
            const key = res.cedula || res.guestName;
            if (!customerMap[key]) {
                customerMap[key] = { name: res.guestName, phone: res.phone, cedula: res.cedula, visits: 0, totalSpent: 0, lastVisit: '1970-01-01T00:00:00.000Z' };
            }
            customerMap[key].visits += 1;
            if (res.payment?.status === 'Cancelado') customerMap[key].totalSpent += res.payment.amount || 0;
            if (parseISO(res.checkInDate) > parseISO(customerMap[key].lastVisit)) {
                customerMap[key].lastVisit = res.checkInDate;
                customerMap[key].phone = res.phone;
                customerMap[key].cedula = res.cedula;
            }
        });
        const customersSheetData = Object.values(customerMap).map(c => ({
            'Nombre Cliente': c.name, 'Teléfono': c.phone, 'Cédula': c.cedula,
            'Número de Visitas': c.visits, 'Gasto Total (C$)': c.totalSpent,
            'Última Visita': format(parseISO(c.lastVisit), 'yyyy-MM-dd'),
        }));
        
        const roomsSheetData = roomsData.map(room => ({ 'ID': room.id, 'Título': room.title, 'Precio (C$)': room.price, 'Tipo': room.type, 'Estado': room.status }));
        const usersSheetData = usersData.map(user => ({ 'ID': user.id, 'Nombre': user.username, 'Correo': user.email, 'Rol': user.role }));
        const consumptionItemsSheetData = consumptionItemsData.map(item => ({ 'ID': item.id, 'Nombre': item.name, 'Precio (C$)': item.price, 'Icono': item.icon }));

        handleExport([
            { data: summarySheetData, name: 'Resumen' },
            { data: reservationsSheetData, name: 'Reservas Pagadas' },
            { data: expensesSheetData, name: 'Gastos' },
            { data: customersSheetData, name: 'Clientes' },
            { data: roomsSheetData, name: 'Habitaciones' },
            { data: usersSheetData, name: 'Socios' },
            { data: consumptionItemsSheetData, name: 'Consumos' },
        ], 'Reporte_Hotel_RIGUT');
    };

    const isLoading = isUserLoading || reservationsLoading || roomsLoading || expensesLoading || usersLoading || consumptionItemsLoading;

    if (isLoading) {
        return (
            <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
                 <header className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-7 w-48" />
                </header>
                <main className="max-w-2xl mx-auto space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-40 w-full" />
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

            <main className="max-w-3xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Filtro por Fecha</CardTitle>
                        <CardDescription>
                            Selecciona un rango de fechas para exportar los datos transaccionales (reservas y gastos).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2">
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="ghost" size="sm" onClick={setToday}>Hoy</Button>
                            <Button variant="ghost" size="sm" onClick={setThisWeek}>Semana</Button>
                            <Button variant="ghost" size="sm" onClick={setThisMonth}>Mes</Button>
                            <Button variant="ghost" size="sm" onClick={setLastMonth}>Mes Pasado</Button>
                            <Button variant="ghost" size="sm" onClick={setThisYear}>Año</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Reporte Completo</CardTitle>
                        <CardDescription>
                            Exporta un archivo Excel con toda la información de la aplicación, aplicando el filtro de fecha.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={exportAllData}
                            disabled={isExporting || isLoading}
                            className="w-full sm:w-auto"
                        >
                            <Download className="mr-3 h-5 w-5" />
                            {isExporting ? 'Exportando...' : 'Exportar Reporte Completo'}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
