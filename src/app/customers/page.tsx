"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutGrid, Calendar, Users, Settings, Search, Phone } from 'lucide-react';
import { CustomerDetailModal, type PastGuest } from '@/components/dashboard/customer-detail-modal';

const customersData: PastGuest[] = [
    { name: "Ricardo Gomez", date: "23 Ene - 26 Ene", avatar: "RG", phone: "11 5555-1234", vehicle: 'truck', payment: { status: 'Cancelado', amount: 2400 } },
    { name: "Mariana Lopez", date: "19 Ene - 22 Ene", avatar: "ML", phone: "11 5555-5555", vehicle: 'car', payment: { status: 'Cancelado', amount: 2400 } },
    { name: "Juan Pérez", date: "22 Ene - 25 Ene", avatar: "JP", phone: "11 1234-5678", vehicle: 'car', payment: { status: 'Pendiente', amount: 500 } },
    { name: "Ana Torres", date: "15 Ene - 18 Ene", avatar: "AT", phone: "11-1111-1111", vehicle: 'bike', payment: { status: 'Cancelado', amount: 2100 } },
    { name: "Carlos Rivas", date: "10 Ene - 12 Ene", avatar: "CR", phone: "11-2222-2222", vehicle: 'truck', payment: { status: 'Cancelado', amount: 1400 } },
    { name: "Beatriz Mella", date: "05 Ene - 08 Ene", avatar: "BM", phone: "11-3333-3333", vehicle: 'car', payment: { status: 'Cancelado', amount: 2100 } },
    { name: "Luisa Fernandez", date: "18 Ene - 21 Ene", avatar: "LF", vehicle: 'car' },
    { name: "Mario Gomez", date: "14 Ene - 17 Ene", avatar: "MG", vehicle: 'bike' },
    { name: "Sofia Castro", date: "10 Ene - 13 Ene", avatar: "SC", vehicle: 'car' },
    { name: "David Choi", date: "20 Ene - 23 Ene", avatar: "DC", vehicle: 'truck' },
    { name: "Emily White", date: "15 Ene - 19 Ene", avatar: "EW", vehicle: 'car' },
    { name: "Frank Black", date: "11 Ene - 14 Ene", avatar: "FB", vehicle: 'car' },
    { name: "Laura Sanchez", date: "24 Ene - 28 Ene", avatar: "LS", phone: "11 2233-4455", vehicle: 'bike', payment: { status: 'Cancelado', amount: 400 } },
    { name: "Pedro Ramirez", date: "20 Ene - 23 Ene", avatar: "PR", vehicle: 'bike' },
    { name: "Julia Roberts", date: "15 Ene - 18 Ene", avatar: "JR", vehicle: 'car' },
    { name: "Maria Garcia", date: "24 Ene - 27 Ene", avatar: "MG", phone: "11 8765-4321", vehicle: 'bike', payment: { status: 'Cancelado', amount: 400 } },
    { name: "George Harris", date: "18 Ene - 22 Ene", avatar: "GH", vehicle: 'truck' },
    { name: "Helen Ivanova", date: "12 Ene - 16 Ene", avatar: "HI", vehicle: 'car' },
    { name: "Ian Jacobs", date: "07 Ene - 11 Ene", avatar: "IJ", vehicle: 'bike' },
    { name: "Jack King", date: "19 Ene - 22 Ene", avatar: "JK", vehicle: 'car' },
    { name: "Karen Lee", date: "14 Ene - 17 Ene", avatar: "KL", vehicle: 'bike' },
    { name: "Leo Miller", date: "09 Ene - 12 Ene", avatar: "LM", vehicle: 'truck' },
    { name: "Nora Nelson", date: "16 Ene - 20 Ene", avatar: "NN", vehicle: 'car' },
    { name: "Oscar Price", date: "11 Ene - 15 Ene", avatar: "OP", vehicle: 'bike' },
    { name: "Pamela Queen", date: "06 Ene - 10 Ene", avatar: "PQ", vehicle: 'car' },
    { name: "Familia Rodriguez", date: "21 Ene - 26 Ene", avatar: "FR", phone: "11 9988-7766", vehicle: 'truck', payment: { status: 'Pendiente', amount: 120 } },
    { name: "Sandra Bullock", date: "10 Ene - 12 Ene", avatar: "SB", vehicle: 'car' },
    { name: "Ernesto Padilla", date: "24 Ene - 25 Ene", avatar: "EP", phone: "11 1122-3344", vehicle: 'car', payment: { status: 'Cancelado', amount: 400 } },
    { name: "Sofia Loren", date: "22 Ene - 24 Ene", avatar: "SL", phone: "11 8888-9999", vehicle: 'car', payment: { status: 'Cancelado', amount: 400 } },
    { name: "Carlos Vives", date: "24 Ene - 29 Ene", avatar: "CV", phone: "11 7777-6666", vehicle: 'bike', payment: { status: 'Pendiente', amount: 250 } },
];

const uniqueCustomers = Array.from(new Map(customersData.map(item => [item.name, item])).values());

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
