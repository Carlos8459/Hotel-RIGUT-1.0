import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, DollarSign, Search, PlusCircle, Sparkles, Wrench, KeyRound, LogOut, Check } from "lucide-react";

const roomsData = [
  {
    id: 102,
    title: "Habitación 102",
    guest: "Juan Pérez",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "22 Ene - 25 Ene (3 noches)",
    occupancy: "2 Adultos",
    progress: 70,
    progressColor: "[&>div]:bg-red-500",
    payment: {
      status: "Pendiente",
      amount: 50,
      color: "text-yellow-400"
    },
    action: {
      text: "Checkout",
      icon: <LogOut className="mr-2 h-4 w-4" />
    }
  },
  {
    id: 103,
    title: "Habitación 103",
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: {
      text: "Crear Reserva",
      icon: <PlusCircle className="mr-2 h-4 w-4" />
    },
    secondaryAction: {
      icon: <KeyRound className="h-5 w-5" />
    }
  },
  {
    id: 104,
    title: "Habitación 104",
    statusText: "Reserva",
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    guest: "Próxima Reserva",
    date: "24 Ene",
    occupancy: "1 Adulto",
    action: {
      text: "Check-in",
      icon: <Check className="mr-2 h-4 w-4" />
    }
  },
  {
    id: 201,
    title: "Habitación 201",
    guest: "Maria Garcia",
    statusText: "Acomodada",
    statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    date: "24 Ene - 27 Ene (3 noches)",
    occupancy: "1 Adulto",
    progress: 33,
    progressColor: "[&>div]:bg-cyan-500",
    action: {
      text: "Ver check-in",
    }
  },
  {
    id: 202,
    title: "Habitación 202",
    guest: "Reservada",
    statusText: "Reservada",
    statusColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    details: "Revisión de plomería",
    detailsIcon: <Wrench className="mr-2 h-4 w-4" />,
    payment: {
      status: "Confirmado",
      color: "text-green-400"
    },
    action: {
      text: "Ver reporte",
    }
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
    action: {
      text: "Ver reporte",
    }
  }
];

export default function RoomsDashboard() {
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
          <Card key={room.id} className="bg-card border-border text-foreground flex flex-col">
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
              {room.occupancy && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  <span>{room.occupancy}</span>
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
              {room.progress !== undefined && (
                <div className="flex justify-between items-center pt-2">
                    <Progress value={room.progress} className={`w-3/4 bg-muted ${room.progressColor}`} />
                    <span className="text-sm font-medium">{room.progress}%</span>
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
    </div>
  );
}
