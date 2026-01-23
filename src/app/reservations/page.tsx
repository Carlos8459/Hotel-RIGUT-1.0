"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { roomsData } from "@/lib/hotel-data";
import { LayoutGrid, Calendar as CalendarIcon, Users, Settings, User, PlusCircle } from "lucide-react";
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper to parse dates like "24 Ene" or "23 Ene - ..."
const parseReservationDate = (dateStr: string): Date | null => {
    try {
        const currentYear = new Date().getFullYear();
        // Take only the start date part, e.g., "24 Ene" from "24 Ene - 26 Ene"
        const datePart = dateStr.split(' - ')[0];
        // The date format in hotel-data.ts is like "24 Ene". `d LLL` should parse it.
        return parse(`${datePart} ${currentYear}`, 'd LLL yyyy', { locale: es });
    } catch (e) {
        console.error("Error parsing date:", dateStr, e);
        return null;
    }
};

const reservations = roomsData
    .filter(room => room.statusText === 'Reserva' || room.statusText === 'Reservada')
    .map(room => ({
        ...room,
        reservationDate: room.date ? parseReservationDate(room.date) : null
    }))
    .filter(room => room.reservationDate instanceof Date && !isNaN(room.reservationDate.getTime()));

const reservationDates = reservations.map(r => r.reservationDate).filter((d): d is Date => d !== null);


export default function ReservationsPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : '';

    const selectedDateReservations = reservations.filter(r => 
        r.reservationDate && format(r.reservationDate, 'yyyy-MM-dd') === selectedDateStr
    );

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Reservas</h1>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Nueva Reserva
                </Button>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="bg-card border-border">
                        <CardContent className="flex justify-center p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={es}
                                modifiers={{ reserved: reservationDates }}
                                modifiersClassNames={{
                                    reserved: 'bg-primary text-primary-foreground rounded-full',
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Reservas para {date ? format(date, 'd MMMM yyyy', { locale: es }) : '...'}
                    </h2>
                    {selectedDateReservations.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDateReservations.map(res => (
                                <Card key={res.id} className="bg-card border-border">
                                    <CardContent className="p-4 space-y-2">
                                       <div className="flex justify-between items-center">
                                            <p className="font-bold">{res.title}</p>
                                            <Badge className={res.statusColor}>{res.statusText}</Badge>
                                       </div>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>{res.guest === 'Próxima Reserva' ? 'Sin Asignar' : res.guest}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center text-center text-muted-foreground h-full rounded-lg border border-dashed">
                           <div className="p-8">
                             <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                             <p className="mt-4">No hay reservas para esta fecha.</p>
                           </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-10 md:hidden">
                <div className="flex justify-around">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <LayoutGrid className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Habitaciones</span>
                        </Button>
                    </Link>
                    <Link href="/reservations">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-primary px-2 py-1">
                            <CalendarIcon className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Reservas</span>
                        </Button>
                    </Link>
                    <Link href="/customers">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
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
