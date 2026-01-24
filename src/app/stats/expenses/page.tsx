'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, DollarSign, Tag, Calendar as CalendarIcon, User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Expense } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Component for date range picker
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ExpensesStatsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('date', 'desc')) : null, [firestore]);
  const { data: expensesData, isLoading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

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

  const filteredExpenses = useMemo(() => {
    if (!expensesData) return [];
    if (!dateRange?.from) return expensesData as Expense[];
    const endOfRange = dateRange.to ?? dateRange.from;
    return expensesData.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start: dateRange.from!, end: endOfRange });
    }) as Expense[];
  }, [expensesData, dateRange]);

  const { totalExpense, categoryData } = useMemo(() => {
    const total = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

    const categories: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
      if (!categories[exp.category]) {
        categories[exp.category] = 0;
      }
      categories[exp.category] += exp.amount;
    });

    const chartData = Object.entries(categories).map(([name, value]) => ({ name, value }));

    return { totalExpense: total, categoryData: chartData };
  }, [filteredExpenses]);

  const currencyFormatter = new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 2,
  });

  const isLoading = isUserLoading || expensesLoading;

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
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div className="flex-grow">
                    <h1 className="text-2xl font-bold">Estadísticas de Gastos</h1>
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

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground absolute top-6 right-6" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{currencyFormatter.format(totalExpense)}</p>
                        <p className="text-xs text-muted-foreground">en el período seleccionado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted-foreground text-sm">No hay datos</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Historial de Gastos</CardTitle>
                        <CardDescription>Lista de gastos individuales en el período seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh]">
                            <div className="space-y-2 pr-4">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map(expense => (
                                    <div key={expense.id} onClick={() => setSelectedExpense(expense)} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                                        <div className="flex-grow space-y-1">
                                            <p className="font-medium truncate">{expense.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center"><Tag className="mr-1 h-3 w-3"/>{expense.category}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-base">{currencyFormatter.format(expense.amount)}</p>
                                            <p className="text-sm text-muted-foreground">{format(parseISO(expense.date), 'd MMM yyyy', { locale: es })}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground p-8">No hay gastos registrados en este período.</div>
                            )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </main>
      </div>

      <Dialog open={!!selectedExpense} onOpenChange={(isOpen) => !isOpen && setSelectedExpense(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Detalle del Gasto</DialogTitle>
                <DialogDescription>{selectedExpense?.description}</DialogDescription>
            </DialogHeader>
            {selectedExpense && (
                <div className="space-y-4 py-4">
                    <div className="flex items-center"><DollarSign className="h-4 w-4 mr-3 text-muted-foreground" /><span className="font-semibold">{currencyFormatter.format(selectedExpense.amount)}</span></div>
                    <div className="flex items-center"><Tag className="h-4 w-4 mr-3 text-muted-foreground" /><span>{selectedExpense.category}</span></div>
                    <div className="flex items-center"><CalendarIcon className="h-4 w-4 mr-3 text-muted-foreground" /><span>{format(parseISO(selectedExpense.date), "PPP, h:mm a", { locale: es })}</span></div>
                    <div className="flex items-center"><User className="h-4 w-4 mr-3 text-muted-foreground" /><span>Registrado por: {selectedExpense.creatorName}</span></div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
