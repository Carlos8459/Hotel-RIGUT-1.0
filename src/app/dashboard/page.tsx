"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, DollarSign, Search, PlusCircle, Sparkles, Phone, Car, Bike, Truck, LayoutGrid, Users, Settings } from "lucide-react";
import { RoomDetailModal } from "@/components/dashboard/room-detail-modal";
import { roomsData, getRoomDescription } from "@/lib/hotel-data";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";


export default function RoomsDashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleCardClick = (room: any) => {
    setSelectedRoom(room);
  };

  const handleCloseModal = () => {
    setSelectedRoom(null);
  };

  const filteredRooms = roomsData.filter(room => {
    if (!searchTerm) return true;
    if (!room.guest || ['Próxima Reserva', 'Reservada', 'Mantenimiento'].includes(room.guest)) return false;
    return room.guest.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold">Hotel RIGUT</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes..."
              className="bg-card border-border pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0">
            <Link href="/new-reservation">
                <PlusCircle className="mr-2 h-5 w-5" />
                Nueva Reserva
            </Link>
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
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Card key={room.id} onClick={() => handleCardClick(room)} className="bg-card border-border text-foreground flex flex-col cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{room.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getRoomDescription(room.price, room.id)}</p>
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
                    <span>
                      {room.vehicle === 'car' ? 'Carro' : room.vehicle === 'bike' ? 'Moto' : 'Camión'}
                    </span>
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
                      {room.payment.status}
                      {room.payment.amount && ` (C$${room.payment.amount})`}
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
          ))
        ) : (
            <div className="col-span-full text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                No se encontraron clientes que coincidan con la búsqueda.
            </div>
        )}
      </main>

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          isOpen={!!selectedRoom}
          onClose={handleCloseModal}
        />
      )}

      <div className="text-center text-sm text-muted-foreground mt-12">
        <p>desarrollado por Carlos Rivera</p>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-10 md:hidden">
        <div className="flex justify-around">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-primary px-2 py-1">
              <LayoutGrid className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Habitaciones</span>
            </Button>
          </Link>
          <Link href="/reservations">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Reservas</span>
            </Button>
          </Link>
          <Link href="/customers">
            <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
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
