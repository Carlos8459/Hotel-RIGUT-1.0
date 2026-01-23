"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutGrid, Calendar, Users, Settings, Search, Phone } from 'lucide-react';
import { CustomerDetailModal, type PastGuest } from '@/components/dashboard/customer-detail-modal';
import { roomsData } from '@/lib/hotel-data';

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

// Remove duplicates by customer name, keeping the latest entry
const uniqueCustomers = Array.from(new Map(allGuests.map(item => [item.name, item])).values());


export default function CustomersPage() {
    const [selectedGuest, setSelectedGuest] = useState<PastGuest | null>(null);

    const handleGuestClick = (guest: PastGuest) => {
        setSelectedGuest(guest);
    };

    const handleCloseModal = () => {
        setSelectedGuest(null);
    };

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
          />
        </div>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {uniqueCustomers.map((customer, index) => (
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
            </Card>
        ))}
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
          <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Reservas</span>
          </Button>
          <Link href="/customers">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-primary px-2 py-1">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Clientes</span>
            </Button>
          </Link>
          <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Ajustes</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}

    