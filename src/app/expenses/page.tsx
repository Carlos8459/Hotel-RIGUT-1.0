
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, doc, query, orderBy } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, ArrowLeft, Receipt, DollarSign, Tag, List, Trash2, Pencil } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { Expense } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import Link from 'next/link';
import {
  LayoutGrid,
  Users,
  Settings,
  BarChart2,
  Wrench,
} from 'lucide-react';


const expenseFormSchema = z.object({
  description: z.string().min(3, { message: 'La descripción debe tener al menos 3 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'El monto debe ser un número positivo.' }),
  date: z.date({ required_error: 'La fecha del gasto es obligatoria.' }),
  category: z.enum(['Mantenimiento', 'Salarios', 'Suministros', 'Servicios Públicos', 'Marketing', 'Otros'], { required_error: 'Debe seleccionar una categoría.' }),
});

const expenseCategories = ['Mantenimiento', 'Salarios', 'Suministros', 'Servicios Públicos', 'Marketing', 'Otros'] as const;

export default function ExpensesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User profile data
  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{username: string, role: string}>(userDocRef);

  // Expenses data
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('date', 'desc')) : null, [firestore]);
  const { data: expensesData, isLoading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: '' as any,
      date: new Date(),
      category: undefined,
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  function onSubmit(data: z.infer<typeof expenseFormSchema>) {
    if (!firestore || !user || !userProfile) return;
    setIsSubmitting(true);

    const expensesColRef = collection(firestore, 'expenses');
    
    const expenseData = {
      ...data,
      date: data.date.toISOString(),
      amount: data.amount,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      creatorName: userProfile.username,
    };

    addDocumentNonBlocking(expensesColRef, expenseData)
      .then(() => {
        toast({
          title: 'Gasto Registrado',
          description: `Se ha registrado el gasto de ${data.description}.`,
        });
        form.reset({
            description: '',
            amount: '' as any,
            date: new Date(),
            category: undefined,
        });
      })
      .catch((error) => {
        console.error("Error creating expense:", error);
        toast({
          variant: 'destructive',
          title: 'Error al registrar el gasto',
          description: 'No se pudo guardar el gasto. Inténtalo de nuevo.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  const handleDeleteExpense = (expenseId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'expenses', expenseId));
    toast({
      title: 'Gasto Eliminado',
      description: 'El registro de gasto ha sido eliminado.',
      variant: 'destructive'
    });
  };

  const currencyFormatter = new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 2,
  });

  const isLoading = isUserLoading || isUserProfileLoading;
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 pt-12 sm:p-6 lg:p-8 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <h1 className="text-2xl font-bold">Registro de Gastos</h1>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Receipt className="h-5 w-5" />Nuevo Gasto</h2>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <div className="relative flex items-center">
                        <Pencil className="absolute left-3 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="Ej: Pago de factura de luz" {...field} className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary" />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Monto (C$)</FormLabel>
                        <div className="relative flex items-center">
                            <DollarSign className="absolute left-3 h-5 w-5 text-muted-foreground" />
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary"/>
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha del Gasto</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'ghost'}
                                    className={cn(
                                    'w-full justify-start text-left font-normal border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary',
                                    !field.value && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                    format(field.value, 'PPP', { locale: es })
                                    ) : (
                                    <span>Seleccionar fecha</span>
                                    )}
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <div className="relative flex items-center">
                                <Tag className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                <SelectTrigger className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus:ring-0 focus:ring-offset-0 focus:border-primary">
                                    <SelectValue placeholder="Seleccionar una categoría" />
                                </SelectTrigger>
                            </div>
                        </FormControl>
                        <SelectContent>
                        {expenseCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar Gasto'}
                </Button>
            </form>
            </Form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><List className="h-5 w-5" />Gastos Recientes</h2>
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {expensesLoading ? (
                             [...Array(5)].map((_, i) => (
                               <div key={i} className="p-4"><Skeleton className="h-10 w-full" /></div>
                             ))
                        ) : expensesData && expensesData.length > 0 ? (
                           expensesData.map((expense, index) => (
                                <div key={expense.id}>
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex-grow space-y-1">
                                            <p className="font-medium truncate">{expense.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center"><Tag className="mr-1 h-3 w-3"/>{expense.category}</span>
                                                <span className="flex items-center"><CalendarIcon className="mr-1 h-3 w-3"/>{format(parseISO(expense.date), 'd MMM yyyy', { locale: es })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-base whitespace-nowrap">{currencyFormatter.format(expense.amount)}</p>
                                             {(userProfile?.role === 'Admin' || expense.createdBy === user?.uid) && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción no se puede deshacer. Se eliminará permanentemente este registro de gasto.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteExpense(expense.id)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                    {index < expensesData.length - 1 && <Separator />}
                                </div>
                           ))
                        ) : (
                            <div className="text-center text-muted-foreground p-8">
                                <p>No hay gastos registrados todavía.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
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
            <Button variant="ghost" className="flex flex-col h-auto items-center text-primary bg-primary/10 rounded-lg px-2 py-1">
              <Wrench className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Herramientas</span>
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
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

    