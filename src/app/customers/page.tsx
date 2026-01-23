"use client";

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutGrid, Calendar as CalendarIcon, Users, Settings, Search, Phone, Home } from 'lucide-react';
import { CustomerDetailModal, type PastGuest } from '@/components/dashboard/customer-detail-modal';
import { roomsData } from '@/lib/hotel-data';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

// Helper to parse dates like "24 Ene" or "23 Ene - 26 Ene"
const parseDate = (dateStr: string, position: 'start' | 'end'): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    try {
        const currentYear = new Date().getFullYear();
        const parts = dateStr.split(' - ');
        let datePart;
        if (parts.length > 1) {
            datePart = position === 'start' ? parts[0] : parts[1].split(' (')[0];
        } else {
            datePart = parts[0].split(' (')[0];
        }
        return parse(`${datePart} ${currentYear}`, 'd LLL yyyy', { locale: es });
    } catch (e) {
        // console.error(`Error parsing ${position} date:`, dateStr, e);
        return null;
    }
};

interface Customer extends PastGuest {
    startDate: Date | null;
    endDate: Date | null;
    visitCount: number;
}

// This logic constructs the list of all customers from the rooms data
const allGuests: PastGuest[] = [];
roomsData.forEach(room => {
  // Current guests in rooms
  if (room.guest && !['Próxima Reserva', 'Reservada', 'Mantenimiento'].includes(room.guest)) {
    allGuests.push({
      name: room.guest,
      date: room.date || 'N/A',
      avatar: room.guest.split(' ').map(n => n[0]).join(''),
      phone: room.phone,
      payment: room.payment ? { status: room.payment.status, amount: room.payment.amount } : undefined,
      vehicle: room.vehicle,
      roomTitle: room.title
    });
  }
  // Past guests from room history
  room.history.forEach(hist => {
    allGuests.push({
      ...hist,
      roomTitle: room.title
    });
  });
});

const guestVisits: { [name: string]: PastGuest[] } = {};
allGuests.forEach(guest => {
    if (!guestVisits[guest.name]) {
        guestVisits[guest.name] = [];
    }
    guestVisits[guest.name].push(guest);
});

const allCustomers: Customer[] = Object.values(guestVisits).map(visits => {
    const latestVisit = visits.sort((a, b) => {
        const dateA = parseDate(a.date, 'end');
        const dateB = parseDate(b.date, 'end');
        if (dateA && dateB) return dateB.getTime() - a.getTime();
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
    })[0];
    
    return {
        ...latestVisit,
        startDate: parseDate(latestVisit.date, 'start'),
        endDate: parseDate(latestVisit.date, 'end'),
        visitCount: visits.length,
    };
}).sort((a,b) => a.name.localeCompare(b.name));


export default function CustomersPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [selectedGuest, setSelectedGuest] = useState<PastGuest | null>(null);
    const [filter, setFilter] = useState('all');
    const [date, setDate] = useState<Date | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');

    useEffect(() => {
        if (!isUserLoading && !user) {
        router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }

    const handleGuestClick = (guest: PastGuest) => {
        setSelectedGuest(guest);
    };

    const handleCloseModal = () => {
        setSelectedGuest(null);
    };
    
    const filteredCustomers = useMemo(() => {
        let customers = [...allCustomers];
    
        // Search filter
        if (searchTerm) {
            customers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Room filter
        if (selectedRoom) {
            customers = customers.filter(customer => {
                const visits = guestVisits[customer.name] || [];
                return visits.some(visit => visit.roomTitle === selectedRoom);
            });
        }
    
        // Tabs filter
        switch (filter) {
            case 'recent': {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const now = new Date();
                customers = customers
                    .filter(c => c.endDate && c.endDate >= thirtyDaysAgo && c.endDate <= now)
                    .sort((a,b) => b.endDate!.getTime() - a.endDate!.getTime());
                break;
            }
            case 'frequent':
                // More than 1 visit, sorted by visit count
                customers = customers.filter(c => c.visitCount > 1).sort((a, b) => b.visitCount - a.visitCount);
                break;
            default: // 'all'
                // Already sorted by name
                break;
        }
    
        // Date filter
        if (date) {
            customers = customers.filter(c => {
                 const visitStartDate = c.startDate;
                 const visitEndDate = c.endDate;
                 if (!visitStartDate || !visitEndDate) return false;
                 
                 return isWithinInterval(date, { start: visitStartDate, end: visitEndDate });
            });
        }
    
        return customers;
    
    }, [filter, date, searchTerm, selectedRoom]);

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
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
          <Select value={selectedRoom} onValueChange={(value) => setSelectedRoom(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <Home className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Buscar por habitación" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas las habitaciones</SelectItem>
                {roomsData.map(room => (
                    <SelectItem key={room.id} value={room.title}>
                        {room.title}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        </div>
      </div>

      <main className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, index) => (
                <Card key={index} onClick={() => handleGuestClick(customer)} className="bg-card border-border text-foreground flex items-center p-4 cursor-pointer hover:border-primary transition-colors">
                    <Avatar className="h-12 w-12 mr-4">
                        <AvatarFallback>{customer.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <p className="font-bold text-base">{customer.name}</p>
                        {customer.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
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

      {selectedGuest && (
        <CustomerDetailModal
          isOpen={!!selectedGuest}
          onClose={handleCloseModal}
          guest={selectedGuest}
          showRoom={true}
        />
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-10 md:hidden">
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
          <Link href="/customers">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-primary px-2 py-1">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Clientes</span>
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
