export type Room = {
    id: string;
    title: string;
    price: number;
    type: 'Unipersonal' | 'Matrimonial' | 'Doble' | 'Triple' | 'Quintuple' | 'Unipersonal con A/C' | 'Matrimonial con A/C';
    status: 'Disponible' | 'Mantenimiento';
};

export type ExtraConsumption = {
  name: string;
  quantity: number;
  price: number;
  icon: string;
};

export type ConsumptionItem = {
    id: string;
    name: string;
    price: number;
    icon: string;
};

export type Reservation = {
  id: string;
  guestName: string;
  cedula?: string;
  phone?: string;
  checkInDate: string; // ISO string
  checkOutDate: string; // ISO string
  roomId: string;
  vehicle?: 'car' | 'bike' | 'truck';
  status: 'Checked-In' | 'Checked-Out' | 'Cancelled';
  payment: {
    status: 'Pendiente' | 'Cancelado';
    amount: number;
  };
  createdAt: string; // ISO string
  createdBy: string; // UID
  extraConsumptions?: ExtraConsumption[];
};

export type Customer = {
  name: string;
  phone?: string;
  avatar: string;
  lastVisitDate: string; // ISO string
  visitCount: number;
  history: Reservation[];
};

export type Notification = {
  id: string;
  message: string;
  createdAt: string; // ISO string
  createdBy: string; // UID
  creatorName: string;
  isRead: boolean;
};

export type WhatsappConfig = {
  id: string;
  messageTemplate: string;
  isEnabled: boolean;
};

export type NotificationConfig = {
  id: string;
  isEnabled: boolean;
  onNewReservation: boolean;
  onCheckOut: boolean;
  onNewExpense: boolean;
};

export type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO string
    category: 'Mantenimiento' | 'Salarios' | 'Suministros' | 'Servicios Públicos' | 'Marketing' | 'Otros';
    createdAt: string; // ISO string
    createdBy: string; // UID
    creatorName: string;
};
