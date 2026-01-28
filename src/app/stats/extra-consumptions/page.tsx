'use client';

import { useMemo, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import {
  format,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, DollarSign, Package, ShoppingCart, Calendar as CalendarIcon, Utensils, GlassWater, Droplet, Droplets, Beer, Coffee, Sandwich, CakeSlice, IceCream } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Reservation } from '@/lib/types';


interface ConsumptionStats {
    name: string;
    icon: string;
    totalQuantity: number;
    totalIncome: number;
}

const availableIcons: { [key: string]: ReactNode } = {
    Utensils: <Utensils className="h-6 w-6 text-muted-foreground" />,
    GlassWater: <GlassWater className="h-6 w-6 text-muted-foreground" />,
    Droplet: <Droplet className="h-6 w-6 text-muted-foreground" />,
    Droplets: <Droplets className="h-6 w-6 text-muted-foreground" />,
    Beer: <Beer className="h-6 w-6 text-muted-foreground" />,
    Coffee: <Coffee className="h-6 w-6 text-muted-foreground" />,
    Sandwich: <Sandwich className="h-6 w-6 text-muted-foreground" />,
    CakeSlice: <CakeSlice className="h-6 w-6 text-muted-foreground" />,
    IceCream: <IceCream className="h-6 w-6 text-muted-foreground" />,
    Package: <Package className="h-6 w-6 text-muted-foreground" />,
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


export default function ExtraConsumptionsStatsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    
    // State
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    
    // Data fetching
    const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);
    const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const setToday = () => {
        const today = new Date();
        setDateRange({ from: startOfDay(today), to: endOfDay(today) });
    };

    const setThisWeek = () => {
        const today = new Date();
        setDateRange({ from: startOfWeek(today, { locale: es }), to: endOfWeek(today, { locale: es }) });
    };

    const setThisMonth = () => {
        setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    };

    const setLastMonth = () => {
        const lastMonth = subMonths(new Date(), 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    };
    
    const setThisYear = () => {
        setDateRange({ from: startOfYear(new Date()), to: endOfYear(new Date()) });
    };

    const consumptionStats: ConsumptionStats[] = useMemo(() => {
        if (!reservationsData) return [];

        const statsMap: { [key: string]: ConsumptionStats } = {};

        const filteredReservations = reservationsData.filter(res => {
            if (res.payment?.status !== 'Cancelado') return false;
            if (!dateRange?.from) return true;
            const endOfRange = dateRange.to ?? dateRange.from;
            // We'll filter based on checkout date, assuming that's when payment is finalized
            const checkOutDate = parseISO(res.checkOutDate);
            return isWithinInterval(checkOutDate, { start: dateRange.from, end: endOfRange });
        });

        filteredReservations.forEach(res => {
            res.extraConsumptions?.forEach(consumedItem => {
                if (!statsMap[consumedItem.name]) {
                    statsMap[consumedItem.name] = {
                        name: consumedItem.name,
                        icon: consumedItem.icon || 'Package',
                        totalQuantity: 0,
                        totalIncome: 0,
                    };
                }
                statsMap[consumedItem.name].totalQuantity += consumedItem.quantity;
                statsMap[consumedItem.name].totalIncome += consumedItem.quantity * consumedItem.price;
            });
        });

        return Object.values(statsMap)
            .filter(item => item.totalIncome > 0)
            .sort((a, b) => b.totalIncome - a.totalIncome);

    }, [reservationsData, dateRange]);


    const currencyFormatter = new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 0,
    });

    const isLoading = isUserLoading || reservationsLoading;

    if (isLoading) {
        return (
            <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-7 w-72" />
                    </div>
                    <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap w-full sm:w-auto">
                        <Skeleton className="h-10 w-full sm:w-[300px]" />
                        <Skeleton className="h-9 w-12" />
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-14" />
                    </div>
                </header>
                 <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40" />)}
                 </main>
            </div>
        );
    }
    
    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
             <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver</span>
                    </Button>
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold">Estadísticas de Ingresos Extras</h1>
                    </div>
                </div>
                 <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap w-full sm:w-auto">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button variant="outline" size="sm" onClick={setToday}>Hoy</Button>
                    <Button variant="outline" size="sm" onClick={setThisWeek}>Semana</Button>
                    <Button variant="outline" size="sm" onClick={setThisMonth}>Mes</Button>
                    <Button variant="outline" size="sm" onClick={setLastMonth}>Mes Pasado</Button>
                    <Button variant="outline" size="sm" onClick={setThisYear}>Año</Button>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {consumptionStats.length > 0 ? (
                    consumptionStats.map(item => (
                        <Card key={item.name} className="flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4">
                                {availableIcons[item.icon] || <Package className="h-6 w-6 text-muted-foreground" />}
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow grid grid-cols-1 gap-4 text-sm">
                                <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                        <p className="font-bold text-base">{currencyFormatter.format(item.totalIncome)}</p>
                                        <p className="text-muted-foreground">Ingresos Totales</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                        <p className="font-bold text-base">{item.totalQuantity}</p>
                                        <p className="text-muted-foreground">Cantidad Vendida</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                     <div className="col-span-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                        No se encontraron datos de consumos para el período seleccionado.
                    </div>
                )}
            </main>
        </div>
    );
}

    
