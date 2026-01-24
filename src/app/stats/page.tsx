'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  format,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Reservation } from '@/lib/types';
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Users,
  Settings,
  BarChart2,
  DollarSign,
  BookCheck,
  TrendingUp,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


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

export default function StatsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const reservationsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'reservations') : null),
    [firestore]
  );
  const { data: reservations, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);

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

  const paidReservations = useMemo(() => {
    if (!reservations) return [];
    return reservations.filter(
      (res) => res.payment?.status === 'Cancelado' && res.payment.amount > 0
    );
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    if (!dateRange?.from) return paidReservations;
    const endOfRange = dateRange.to ?? dateRange.from;
    return paidReservations.filter((res) => {
      const checkOutDate = parseISO(res.checkOutDate);
      return isWithinInterval(checkOutDate, { start: dateRange.from!, end: endOfRange });
    });
  }, [paidReservations, dateRange]);

  const { totalIncome, paidReservationsCount, averageIncome } = useMemo(() => {
    const count = filteredReservations.length;
    const total = filteredReservations.reduce((acc, res) => acc + (res.payment?.amount || 0), 0);
    return {
      totalIncome: total,
      paidReservationsCount: count,
      averageIncome: count > 0 ? total / count : 0,
    };
  }, [filteredReservations]);

  const dailyIncomeData = useMemo(() => {
    if (!dateRange?.from) return [];
    const endOfRange = dateRange.to ?? dateRange.from;
    const days = eachDayOfInterval({ start: dateRange.from, end: endOfRange });
    
    const dailyData = days.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const income = filteredReservations
            .filter(res => format(parseISO(res.checkOutDate), 'yyyy-MM-dd') === dayString)
            .reduce((acc, res) => acc + (res.payment?.amount || 0), 0);
        return {
            date: format(day, 'd LLL', { locale: es }),
            Ingresos: income,
        };
    });

    return dailyData;

  }, [filteredReservations, dateRange]);

  const monthlyIncomeData = useMemo(() => {
      const yearlyReservations = paidReservations.filter(res => {
          const checkOut = parseISO(res.checkOutDate);
          return isWithinInterval(checkOut, { start: startOfYear(new Date()), end: endOfYear(new Date()) });
      });

      const months = eachMonthOfInterval({ start: startOfYear(new Date()), end: endOfYear(new Date())});

      return months.map(month => {
          const monthString = format(month, 'yyyy-MM');
          const income = yearlyReservations
            .filter(res => format(parseISO(res.checkOutDate), 'yyyy-MM') === monthString)
            .reduce((acc, res) => acc + (res.payment?.amount || 0), 0);
          return {
              month: format(month, 'LLL', { locale: es }),
              Ingresos: income,
          };
      });
  }, [paidReservations]);

  const currencyFormatter = new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 0,
  });

  const chartConfig = {
    Ingresos: {
      label: 'Ingresos',
      color: 'hsl(var(--primary))',
    },
  };
  
  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Estadísticas de Ingresos</h1>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                      Ver más
                      <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                  <DropdownMenuLabel>Más Estadísticas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                      <Link href="/stats/rooms">Estadísticas de Habitaciones</Link>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Button variant="outline" size="sm" onClick={setToday}>Hoy</Button>
            <Button variant="outline" size="sm" onClick={setThisWeek}>Semana</Button>
            <Button variant="outline" size="sm" onClick={setThisMonth}>Mes</Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>Mes Pasado</Button>
            <Button variant="outline" size="sm" onClick={setThisYear}>Año</Button>
        </div>
      </header>

      <main className="space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {reservationsLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{currencyFormatter.format(totalIncome)}</div>}
                    <p className="text-xs text-muted-foreground">Ingresos totales en el período seleccionado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reservas Pagadas</CardTitle>
                    <BookCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {reservationsLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{paidReservationsCount}</div>}
                    <p className="text-xs text-muted-foreground">Total de estadías finalizadas y pagadas</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingreso Promedio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {reservationsLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{currencyFormatter.format(averageIncome)}</div>}
                    <p className="text-xs text-muted-foreground">Ingreso promedio por reserva pagada</p>
                </CardContent>
            </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Ingresos Diarios</CardTitle>
                    <CardDescription>Ingresos generados por día en el período seleccionado.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reservationsLoading ? <Skeleton className="h-[250px] w-full" /> : (
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart data={dailyIncomeData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickFormatter={(value) => currencyFormatter.format(value as number)} />
                            <ChartTooltip 
                                content={<ChartTooltipContent 
                                    formatter={(value) => currencyFormatter.format(value as number)}
                                />}
                            />
                            <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Ingresos Mensuales ({format(new Date(), 'yyyy')})</CardTitle>
                    <CardDescription>Ingresos generados por mes durante el año actual.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reservationsLoading ? <Skeleton className="h-[250px] w-full" /> : (
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart data={monthlyIncomeData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickFormatter={(value) => currencyFormatter.format(value as number).replace('C$', 'C$ ')} />
                            <ChartTooltip 
                                content={<ChartTooltipContent 
                                    formatter={(value) => currencyFormatter.format(value as number)}
                                />}
                            />
                            <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/50 border-t border-border p-2 z-10 backdrop-blur-sm md:hidden">
        <div className="flex justify-around">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
              <LayoutGrid className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Habitaciones</span>
            </Button>
          </Link>
          <Link href="/reservations">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
              <CalendarIcon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Reservas</span>
            </Button>
          </Link>
          <Link href="/tools">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
              <Wrench className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Herramientas</span>
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-primary bg-primary/10 rounded-lg px-2 py-1">
              <BarChart2 className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Estadísticas</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Ajustes</span>
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
