"use client";

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection } from 'firebase/firestore';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutGrid, Calendar as CalendarIcon, Users, Settings, Search, Phone, Home, BarChart2, Wrench, ArrowLeft } from 'lucide-react';
import { CustomerDetailModal } from '@/components/dashboard/customer-detail-modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Reservation, Room, Customer } from '@/lib/types';


export default function CustomersPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [filter, setFilter] = useState('all');
    const [date, setDate] = useState<Date | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');

    const reservationsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reservations') : null, [firestore]);
    const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
    const { data: reservationsData, isLoading: reservationsLoading } = useCollection<Omit<Reservation, 'id'>>(reservationsCollection);
    const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);

    useEffect(() => {
        if (!isUserLoading && !user) {
        router.push('/');
        }
    }, [user, isUserLoading, router]);

    const allCustomers: Customer[] = useMemo(() => {
      if (!reservationsData) return [];

      const guestVisits: { [name: string]: Reservation[] } = {};
      reservationsData.forEach(res => {
          if (!guestVisits[res.guestName]) {
              guestVisits[res.guestName] = [];
          }
          guestVisits[res.guestName].push(res as Reservation);
      });

      return Object.entries(guestVisits).map(([name, visits]) => {
          const sortedVisits = visits.sort((a, b) => parseISO(b.checkInDate).getTime() - parseISO(a.checkInDate).getTime());
          const latestVisit = sortedVisits[0];
          
          return {
              name,
              phone: latestVisit.phone,
              avatar: name.split(' ').map(n => n[0]).join(''),
              lastVisitDate: latestVisit.checkInDate,
              visitCount: visits.length,
              history: sortedVisits,
          };
      }).sort((a,b) => a.name.localeCompare(b.name));

    }, [reservationsData]);

    
    const filteredCustomers = useMemo(() => {
        let customers = [...allCustomers];
    
        // Search filter
        if (searchTerm) {
            customers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Room filter
        if (selectedRoomId) {
            customers = customers.filter(customer => {
                return customer.history.some(visit => visit.roomId === selectedRoomId);
            });
        }
    
        // Tabs filter
        switch (filter) {
            case 'recent': {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                customers = customers
                    .filter(c => {
                        const lastVisit = parseISO(c.lastVisitDate);
                        return lastVisit >= thirtyDaysAgo;
                    })
                    .sort((a,b) => parseISO(b.lastVisitDate).getTime() - parseISO(a.lastVisitDate).getTime());
                break;
            }
            case 'frequent':
                customers = customers.filter(c => c.visitCount > 1).sort((a, b) => b.visitCount - a.visitCount);
                break;
            default: // 'all'
                break;
        }
    
        // Date filter
        if (date) {
            customers = customers.filter(c => {
                 return c.history.some(visit => {
                     const visitStartDate = parseISO(visit.checkInDate);
                     const visitEndDate = parseISO(visit.checkOutDate);
                     return isWithinInterval(date, { start: visitStartDate, end: visitEndDate });
                 });
            });
        }
    
        return customers;
    
    }, [allCustomers, filter, date, searchTerm, selectedRoomId]);

    const handleCustomerClick = (customer: Customer) => {
        setSelectedCustomer(customer);
    };

    const handleCloseModal = () => {
        setSelectedCustomer(null);
    };

    if (isUserLoading || !user || roomsLoading || reservationsLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }
    
    const roomMap = new Map(roomsData?.map(r => [r.id, r.title]));

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
        </Button>
        <div className="flex-grow">
            <h1 className="text-2xl font-bold">Clientes</h1>
        </div>
        <div className="relative flex-grow-0 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar clientes..."
            className="bg-card border-border pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="recent">Recientes</TabsTrigger>
            <TabsTrigger value="frequent">Frecuentes</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Popover>
              <PopoverTrigger asChild>
                  <Button
                  variant={"outline"}
                  className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                  )}
                  >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Buscar por fecha</span>}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                  <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={es}
                  />
              </PopoverContent>
          </Popover>
          {date && <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>Limpiar</Button>}
          <Select value={selectedRoomId} onValueChange={(value) => setSelectedRoomId(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <Home className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Buscar por habitación" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas las habitaciones</SelectItem>
                {roomsData?.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                        {room.title}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        </div>
      </div>

      <main className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(roomsLoading || reservationsLoading) ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
                <Card key={customer.name} onClick={() => handleCustomerClick(customer)} className="bg-card border-border text-foreground flex items-center p-4 cursor-pointer hover:border-primary transition-colors">
                    <Avatar className="h-12 w-12 mr-4">
                        <AvatarFallback>{customer.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <p className="font-bold text-base">{customer.name}</p>
                        {customer.phone && (
                            <div className="flex items-center text-sm text-foreground">
                            <Phone className="mr-2 h-4 w-4" />
                            <span>{customer.phone}</span>
                            </div>
                        )}
                    </div>
                    {filter === 'frequent' && (
                      <div className="text-sm text-muted-foreground font-medium pr-2">
                          {customer.visitCount} visitas
                      </div>
                    )}
                </Card>
            ))
        ) : (
             <div className="col-span-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                No se encontraron clientes que coincidan con los filtros aplicados.
            </div>
        )}
      </main>

      {selectedCustomer && (
        <CustomerDetailModal
          isOpen={!!selectedCustomer}
          onClose={handleCloseModal}
          customer={selectedCustomer}
          roomMap={roomMap}
        />
      )}

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
