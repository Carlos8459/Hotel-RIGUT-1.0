"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, DollarSign, Search, PlusCircle, Sparkles, Wrench, KeyRound, LogOut, Check, Phone, Car, Bike, Truck } from "lucide-react";
import { RoomDetailModal } from "@/components/dashboard/room-detail-modal";

const roomsData = [
  {
    id: 101,
    title: "Habitación 101",
    guest: "Ricardo Gomez",
    phone: "11 5555-1234",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "23 Ene - 26 Ene (3 noches)",
    payment: { status: "Pagado", color: "text-green-400" },
    action: { text: "Checkout", icon: <LogOut className="mr-2 h-4 w-4" /> },
    history: [ { name: "Mariana Lopez", date: "19 Ene - 22 Ene", avatar: "ML" } ],
    vehicle: 'truck'
  },
  {
    id: 102,
    title: "Habitación 102",
    guest: "Juan Pérez",
    phone: "11 1234-5678",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "22 Ene - 25 Ene (3 noches)",
    payment: { status: "Pendiente", amount: 50, color: "text-yellow-400" },
    action: { text: "Checkout", icon: <LogOut className="mr-2 h-4 w-4" /> },
    history: [
      { name: "Ana Torres", date: "15 Ene - 18 Ene", avatar: "AT" },
      { name: "Carlos Rivas", date: "10 Ene - 12 Ene", avatar: "CR" },
      { name: "Beatriz Mella", date: "05 Ene - 08 Ene", avatar: "BM" },
    ],
    vehicle: 'car'
  },
  {
    id: 103,
    title: "Habitación 103",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    secondaryAction: { icon: <KeyRound className="h-5 w-5" /> },
    history: [
      { name: "Luisa Fernandez", date: "18 Ene - 21 Ene", avatar: "LF" },
      { name: "Mario Gomez", date: "14 Ene - 17 Ene", avatar: "MG" },
      { name: "Sofia Castro", date: "10 Ene - 13 Ene", avatar: "SC" },
    ]
  },
  {
    id: 104,
    title: "Habitación 104",
    statusText: "Reserva",
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    guest: "Próxima Reserva",
    date: "24 Ene",
    action: { text: "Check-in", icon: <Check className="mr-2 h-4 w-4" /> },
    history: [
      { name: "David Choi", date: "20 Ene - 23 Ene", avatar: "DC" },
      { name: "Emily White", date: "15 Ene - 19 Ene", avatar: "EW" },
      { name: "Frank Black", date: "11 Ene - 14 Ene", avatar: "FB" },
    ]
  },
  {
    id: 105,
    title: "Habitación 105",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    history: []
  },
  {
    id: 106,
    title: "Habitación 106",
    guest: "Laura Sanchez",
    phone: "11 2233-4455",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "24 Ene - 28 Ene (4 noches)",
    payment: { status: "Pagado", color: "text-green-400" },
    action: { text: "Checkout", icon: <LogOut className="mr-2 h-4 w-4" /> },
    history: [ { name: "Pedro Ramirez", date: "20 Ene - 23 Ene", avatar: "PR" } ],
    vehicle: 'bike'
  },
  {
    id: 107,
    title: "Habitación 107",
    statusText: "Mantenimiento",
    statusColor: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    details: "Pintura",
    detailsIcon: <Wrench className="mr-2 h-4 w-4" />,
    action: { text: "Ver reporte" },
    history: []
  },
  {
    id: 108,
    title: "Habitación 108",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    history: [ { name: "Julia Roberts", date: "15 Ene - 18 Ene", avatar: "JR" } ]
  },
  {
    id: 201,
    title: "Habitación 201",
    guest: "Maria Garcia",
    phone: "11 8765-4321",
    statusText: "Acomodada",
    statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    date: "24 Ene - 27 Ene (3 noches)",
    payment: { status: "Pagado", color: "text-green-400" },
    action: { text: "Ver check-in" },
    history: [
      { name: "George Harris", date: "18 Ene - 22 Ene", avatar: "GH" },
      { name: "Helen Ivanova", date: "12 Ene - 16 Ene", avatar: "HI" },
      { name: "Ian Jacobs", date: "07 Ene - 11 Ene", avatar: "IJ" },
    ],
    vehicle: 'bike'
  },
  {
    id: 202,
    title: "Habitación 202",
    guest: "Reservada",
    statusText: "Reservada",
    statusColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    details: "Revisión de plomería",
    detailsIcon: <Wrench className="mr-2 h-4 w-4" />,
    payment: { status: "Pagado", color: "text-green-400" },
    action: { text: "Ver reporte" },
    history: [
      { name: "Jack King", date: "19 Ene - 22 Ene", avatar: "JK" },
      { name: "Karen Lee", date: "14 Ene - 17 Ene", avatar: "KL" },
      { name: "Leo Miller", date: "09 Ene - 12 Ene", avatar: "LM" },
    ]
  },
  {
    id: 203,
    title: "Habitación 203",
    guest: "Mantenimiento",
    statusText: "Mantenimiento",
    statusColor: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    details: "Inicio: 24 Ene",
    detailsIcon: <Wrench className="mr-2 h-4 w-4" />,
    subDetails: "Incidencia: Fuga de agua",
    action: { text: "Ver reporte" },
    history: [
      { name: "Nora Nelson", date: "16 Ene - 20 Ene", avatar: "NN" },
      { name: "Oscar Price", date: "11 Ene - 15 Ene", avatar: "OP" },
      { name: "Pamela Queen", date: "06 Ene - 10 Ene", avatar: "PQ" },
    ]
  },
  {
    id: 204,
    title: "Habitación 204",
    guest: "Familia Rodriguez",
    phone: "11 9988-7766",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "21 Ene - 26 Ene (5 noches)",
    payment: { status: "Pendiente", amount: 120, color: "text-yellow-400" },
    action: { text: "Checkout", icon: <LogOut className="mr-2 h-4 w-4" /> },
    history: [],
    vehicle: 'truck'
  },
  {
    id: 205,
    title: "Habitación 205",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    history: [ { name: "Sandra Bullock", date: "10 Ene - 12 Ene", avatar: "SB" } ]
  },
  {
    id: 206,
    title: "Habitación 206",
    statusText: "Reserva",
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    guest: "Próxima Reserva",
    date: "25 Ene",
    action: { text: "Check-in", icon: <Check className="mr-2 h-4 w-4" /> },
    history: []
  },
  {
    id: 207,
    title: "Habitación 207",
    guest: "Ernesto Padilla",
    phone: "11 1122-3344",
    statusText: "Acomodada",
    statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    date: "24 Ene - 25 Ene (1 noche)",
    payment: { status: "Pagado", color: "text-green-400" },
    action: { text: "Ver check-in" },
    history: [],
    vehicle: 'car'
  },
  {
    id: 208,
    title: "Habitación 208",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    history: []
  },
  {
    id: 301,
    title: "Habitación 301",
    guest: "Sofia Loren",
    phone: "11 8888-9999",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "22 Ene - 24 Ene (2 noches)",
    payment: { status: "Pagado", color: "text-green-400" },
    action: { text: "Checkout", icon: <LogOut className="mr-2 h-4 w-4" /> },
    history: [],
    vehicle: 'car'
  },
  {
    id: 302,
    title: "Habitación 302",
    statusText: "Mantenimiento",
    statusColor: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    details: "Aire acondicionado",
    detailsIcon: <Wrench className="mr-2 h-4 w-4" />,
    action: { text: "Ver reporte" },
    history: []
  },
  {
    id: 303,
    title: "Habitación 303",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    history: []
  },
  {
    id: 304,
    title: "Habitación 304",
    guest: "Carlos Vives",
    phone: "11 7777-6666",
    statusText: "Acomodada",
    statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    date: "24 Ene - 29 Ene (5 noches)",
    payment: { status: "Pendiente", amount: 250, color: "text-yellow-400" },
    action: { text: "Ver check-in" },
    history: [],
    vehicle: 'bike'
  },
  {
    id: 305,
    title: "Habitación 305",
    statusText: "Reserva",
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    guest: "Próxima Reserva",
    date: "26 Ene",
    action: { text: "Check-in", icon: <Check className="mr-2 h-4 w-4" /> },
    history: []
  },
  {
    id: 306,
    title: "Habitación 306",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    history: []
  }
];


export default function RoomsDashboard() {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const handleCardClick = (room: any) => {
    setSelectedRoom(room);
  };

  const handleCloseModal = () => {
    setSelectedRoom(null);
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold">Hotel RIGUT</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes..."
              className="bg-card border-border pl-10 w-full"
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nueva Reserva
          </Button>
        </div>
      </header>

      <div className="flex justify-between items-center mb-8">
        <Tabs defaultValue="ene24">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="ene22">Ene 22</TabsTrigger>
            <TabsTrigger value="ene23">Ene 23</TabsTrigger>
            <TabsTrigger value="ene24">Ene 24</TabsTrigger>
            <TabsTrigger value="ene25">Ene 25</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="icon">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {roomsData.map((room) => (
          <Card key={room.id} onClick={() => handleCardClick(room)} className="bg-card border-border text-foreground flex flex-col cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{room.title}</CardTitle>
                  {room.guest && <p className="font-bold text-xl">{room.guest}</p>}
                </div>
                {room.statusText && <Badge className={room.statusColor}>{room.statusText}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow">
              {room.date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{room.date}</span>
                </div>
              )}
              {room.guest && !['Próxima Reserva', 'Reservada', 'Mantenimiento'].includes(room.guest) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  <span>{room.guest}</span>
                </div>
              )}
              {room.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  <span>{room.phone}</span>
                </div>
              )}
               {room.vehicle && (
                <div className="flex items-center text-sm text-muted-foreground">
                  {room.vehicle === 'car' && <Car className="mr-2 h-4 w-4" />}
                  {room.vehicle === 'bike' && <Bike className="mr-2 h-4 w-4" />}
                  {room.vehicle === 'truck' && <Truck className="mr-2 h-4 w-4" />}
                  <span>Vehículo</span>
                </div>
              )}
              {room.mainText && (
                <div className="text-center flex-grow flex flex-col justify-center items-center">
                  <p className="text-muted-foreground">{room.mainText}</p>
                </div>
              )}
              {room.details && (
                <div className="flex items-center text-sm text-muted-foreground">
                  {room.detailsIcon}
                  <span>{room.details}</span>
                </div>
              )}
               {room.subDetails && (
                <div className="flex items-center text-sm text-muted-foreground pl-6">
                  <span>{room.subDetails}</span>
                </div>
              )}
              {room.payment && (
                <div className={`flex items-center text-sm pt-2 ${room.payment.color}`}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>
                    Pago: {room.payment.status}
                    {room.payment.amount && ` ($${room.payment.amount})`}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="mt-auto flex flex-col gap-2 pt-4">
              {room.action && (
                  <Button className="w-full bg-secondary hover:bg-accent text-secondary-foreground">
                    {room.action.icon}{room.action.text}
                  </Button>
              )}
               {room.secondaryAction && (
                <div className="flex justify-end w-full">
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    {room.secondaryAction.icon}
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </main>

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          isOpen={!!selectedRoom}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );

    

    