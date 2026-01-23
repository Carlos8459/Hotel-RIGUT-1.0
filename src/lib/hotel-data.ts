
import React from "react";
import { PlusCircle, KeyRound, Check, LogOut, Wrench } from "lucide-react";
import type { PastGuest } from "@/components/dashboard/customer-detail-modal";

export const roomsData = [
  {
    id: 1,
    title: "Habitación 1",
    price: 800,
    guest: "Ricardo Gomez",
    phone: "11 5555-1234",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "23 Ene - 26 Ene (3 noches)",
    payment: { status: "Cancelado", amount: 400, color: "text-green-400" },
    action: { text: "Checkout", icon: React.createElement(LogOut, { className: "mr-2 h-4 w-4" }) },
    history: [ { name: "Mariana Lopez", date: "19 Ene - 22 Ene", avatar: "ML", vehicle: 'car', phone: '11 5555-5555', payment: { status: 'Cancelado', amount: 2400 } } ],
    vehicle: 'truck'
  },
  {
    id: 2,
    title: "Habitación 2",
    price: 800,
    guest: "Juan Pérez",
    phone: "11 1234-5678",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "22 Ene - 25 Ene (3 noches)",
    payment: { status: "Pendiente", amount: 500, color: "text-red-400" },
    action: { text: "Checkout", icon: React.createElement(LogOut, { className: "mr-2 h-4 w-4" }) },
    history: [
      { name: "Ana Torres", date: "15 Ene - 18 Ene", avatar: "AT", vehicle: 'bike', phone: '11-1111-1111', payment: { status: 'Cancelado', amount: 2100 } },
      { name: "Carlos Rivas", date: "10 Ene - 12 Ene", avatar: "CR", vehicle: 'truck', phone: '11-2222-2222', payment: { status: 'Cancelado', amount: 1400 } },
      { name: "Beatriz Mella", date: "05 Ene - 08 Ene", avatar: "BM", vehicle: 'car', phone: '11-3333-3333', payment: { status: 'Cancelado', amount: 2100 } },
    ],
    vehicle: 'car'
  },
  {
    id: 3,
    title: "Habitación 3",
    price: 700,
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: React.createElement(PlusCircle, { className: "mr-2 h-4 w-4" }) },
    secondaryAction: { icon: React.createElement(KeyRound, { className: "h-5 w-5" }) },
    history: [
      { name: "Luisa Fernandez", date: "18 Ene - 21 Ene", avatar: "LF", vehicle: 'car' },
      { name: "Mario Gomez", date: "14 Ene - 17 Ene", avatar: "MG", vehicle: 'bike' },
      { name: "Sofia Castro", date: "10 Ene - 13 Ene", avatar: "SC", vehicle: 'car' },
    ]
  },
  {
    id: 4,
    title: "Habitación 4",
    price: 800,
    statusText: "Reserva",
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    guest: "Próxima Reserva",
    date: "24 Ene",
    action: { text: "Check-in", icon: React.createElement(Check, { className: "mr-2 h-4 w-4" }) },
    history: [
      { name: "David Choi", date: "20 Ene - 23 Ene", avatar: "DC", vehicle: 'truck' },
      { name: "Emily White", date: "15 Ene - 19 Ene", avatar: "EW", vehicle: 'car' },
      { name: "Frank Black", date: "11 Ene - 14 Ene", avatar: "FB", vehicle: 'car' },
    ]
  },
  {
    id: 5,
    title: "Habitación 5",
    price: 700,
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: React.createElement(PlusCircle, { className: "mr-2 h-4 w-4" }) },
    history: []
  },
  {
    id: 6,
    title: "Habitación 6",
    price: 800,
    guest: "Laura Sanchez",
    phone: "11 2233-4455",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "24 Ene - 28 Ene (4 noches)",
    payment: { status: "Cancelado", amount: 400, color: "text-green-400" },
    action: { text: "Checkout", icon: React.createElement(LogOut, { className: "mr-2 h-4 w-4" }) },
    history: [ { name: "Pedro Ramirez", date: "20 Ene - 23 Ene", avatar: "PR", vehicle: 'bike' } ],
    vehicle: 'bike'
  },
  {
    id: 7,
    title: "Habitación 7",
    price: 400,
    statusText: "Mantenimiento",
    statusColor: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    details: "Pintura",
    detailsIcon: React.createElement(Wrench, { className: "mr-2 h-4 w-4" }),
    action: { text: "Ver reporte" },
    history: []
  },
  {
    id: 8,
    title: "Habitación 8",
    price: 500,
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: React.createElement(PlusCircle, { className: "mr-2 h-4 w-4" }) },
    history: [ { name: "Julia Roberts", date: "15 Ene - 18 Ene", avatar: "JR", vehicle: 'car' } ]
  },
  {
    id: 9,
    title: "Habitación 9",
    price: 700,
    guest: "Maria Garcia",
    phone: "11 8765-4321",
    statusText: "Acomodada",
    statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    date: "24 Ene - 27 Ene (3 noches)",
    payment: { status: "Cancelado", amount: 400, color: "text-green-400" },
    action: { text: "Ver check-in" },
    history: [
      { name: "George Harris", date: "18 Ene - 22 Ene", avatar: "GH", vehicle: 'truck' },
      { name: "Helen Ivanova", date: "12 Ene - 16 Ene", avatar: "HI", vehicle: 'car' },
      { name: "Ian Jacobs", date: "07 Ene - 11 Ene", avatar: "IJ", vehicle: 'bike' },
    ],
    vehicle: 'bike'
  },
  {
    id: 10,
    title: "Habitación 10",
    price: 500,
    guest: "Reservada",
    statusText: "Reservada",
    statusColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    details: "Revisión de plomería",
    detailsIcon: React.createElement(Wrench, { className: "mr-2 h-4 w-4" }),
    payment: { status: "Cancelado", amount: 400, color: "text-green-400" },
    action: { text: "Ver reporte" },
    history: [
      { name: "Jack King", date: "19 Ene - 22 Ene", avatar: "JK", vehicle: 'car' },
      { name: "Karen Lee", date: "14 Ene - 17 Ene", avatar: "KL", vehicle: 'bike' },
      { name: "Leo Miller", date: "09 Ene - 12 Ene", avatar: "LM", vehicle: 'truck' },
    ]
  },
  {
    id: 11,
    title: "Habitación 11",
    price: 800,
    guest: "Mantenimiento",
    statusText: "Mantenimiento",
    statusColor: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    details: "Inicio: 24 Ene",
    detailsIcon: React.createElement(Wrench, { className: "mr-2 h-4 w-4" }),
    subDetails: "Incidencia: Fuga de agua",
    action: { text: "Ver reporte" },
    history: [
      { name: "Nora Nelson", date: "16 Ene - 20 Ene", avatar: "NN", vehicle: 'car' },
      { name: "Oscar Price", date: "11 Ene - 15 Ene", avatar: "OP", vehicle: 'bike' },
      { name: "Pamela Queen", date: "06 Ene - 10 Ene", avatar: "PQ", vehicle: 'car' },
    ]
  },
  {
    id: 12,
    title: "Habitación 12",
    price: 800,
    guest: "Familia Rodriguez",
    phone: "11 9988-7766",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "21 Ene - 26 Ene (5 noches)",
    payment: { status: "Pendiente", amount: 120, color: "text-red-400" },
    action: { text: "Checkout", icon: React.createElement(LogOut, { className: "mr-2 h-4 w-4" }) },
    history: [],
    vehicle: 'truck'
  },
  {
    id: 13,
    title: "Habitación 13",
    price: 700,
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: React.createElement(PlusCircle, { className: "mr-2 h-4 w-4" }) },
    history: [ { name: "Sandra Bullock", date: "10 Ene - 12 Ene", avatar: "SB", vehicle: 'car' } ]
  },
  {
    id: 14,
    title: "Habitación 14",
    price: 800,
    statusText: "Reserva",
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    guest: "Próxima Reserva",
    date: "25 Ene",
    action: { text: "Check-in", icon: React.createElement(Check, { className: "mr-2 h-4 w-4" }) },
    history: []
  },
  {
    id: 15,
    title: "Habitación 15",
    price: 700,
    guest: "Ernesto Padilla",
    phone: "11 1122-3344",
    statusText: "Acomodada",
    statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    date: "24 Ene - 25 Ene (1 noche)",
    payment: { status: "Cancelado", amount: 400, color: "text-green-400" },
    action: { text: "Ver check-in" },
    history: [],
    vehicle: 'car'
  },
  {
    id: 16,
    title: "Habitación 16",
    price: 400,
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: React.createElement(PlusCircle, { className: "mr-2 h-4 w-4" }) },
    history: []
  },
  {
    id: 17,
    title: "Habitación 17",
    price: 800,
    guest: "Sofia Loren",
    phone: "11 8888-9999",
    statusText: "Ocupada",
    statusColor: "bg-red-500/20 text-red-400 border-red-500/50",
    date: "22 Ene - 24 Ene (2 noches)",
    payment: { status: "Cancelado", amount: 400, color: "text-green-400" },
    action: { text: "Checkout", icon: React.createElement(LogOut, { className: "mr-2 h-4 w-4" }) },
    history: [],
    vehicle: 'car'
  },
  {
    id: 18,
    title: "Habitación 18",
    price: 800,
    statusText: "Mantenimiento",
    statusColor: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    details: "Aire acondicionado",
    detailsIcon: React.createElement(Wrench, { className: "mr-2 h-4 w-4" }),
    action: { text: "Ver reporte" },
    history: []
  },
  {
    id: 19,
    title: "Habitación 19",
    price: 700,
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: React.createElement(PlusCircle, { className: "mr-2 h-4 w-4" }) },
    history: []
  },
  {
    id: 20,
    title: "Habitación 20",
    price: 700,
    guest: "Carlos Vives",
    phone: "11 7777-6666",
    statusText: "Acomodada",
    statusColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    date: "24 Ene - 29 Ene (5 noches)",
    payment: { status: "Pendiente", amount: 250, color: "text-red-400" },
    action: { text: "Ver check-in" },
    history: [],
    vehicle: 'bike'
  },
  {
    id: 21,
    title: "Habitación 21",
    price: 800,
    statusText: "Reserva",
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    guest: "Próxima Reserva",
    date: "26 Ene",
    action: { text: "Check-in", icon: React.createElement(Check, { className: "mr-2 h-4 w-4" }) },
    history: []
  },
  {
    id: 22,
    title: "Habitación 22",
    price: 700,
    statusText: "Disponible",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    mainText: "Limpia y lista",
    action: { text: "Crear Reserva", icon: React.createElement(PlusCircle, { className: "mr-2 h-4 w-4" }) },
    history: []
  }
];

export const getRoomDescription = (price?: number, roomId?: number) => {
  if (price === undefined || roomId === undefined) return null;

  const acRooms = [1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22];
  const isAcEligible = acRooms.includes(roomId);

  switch (price) {
    case 400:
      return 'Unipersonal';
    case 500:
      return 'Matrimonial';
    case 700:
      return isAcEligible ? 'Unipersonal con aíre acondicionado' : 'Unipersonal';
    case 800:
      return isAcEligible ? 'Matrimonial con aíre acondicionado' : 'Matrimonial';
    default:
      return null;
  }
};

    