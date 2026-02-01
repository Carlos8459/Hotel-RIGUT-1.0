export type Room = {
    id: string;
    title: string;
    price: number;
    type: 'Unipersonal' | 'Matrimonial' | 'Doble' | 'Triple' | 'Quintuple' | 'Unipersonal con A/C' | 'Matrimonial con A/C';
    status: 'Disponible' | 'Limpieza Pendiente' | 'Mantenimiento' | 'No Disponible';
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
  type: Room['type'];
  vehicle?: 'car' | 'bike' | 'truck';
  status: 'Checked-In' | 'Checked-Out' | 'Cancelled';
  payment: {
    status: 'Pendiente' | 'Cancelado';
    amount: number;
  };
  createdAt: string; // ISO string
  createdBy: string; // UID
  extraConsumptions?: ExtraConsumption[];
  notes?: string;
  nickname?: string;
  roomHistory?: {
    roomId: string;
    movedAt: string; // ISO String
  }[];
};

export type Customer = {
  name: string;
  cedula?: string;
  phone?: string;
  avatar: string;
  lastVisitDate: string; // ISO string
  visitCount: number;
  history: Reservation[];
  notes?: string[];
};

export type Notification = {
  id: string;
  message: string;
  createdAt: string; // ISO string
  createdBy: string; // UID
  creatorName: string;
  isRead: boolean;
  type?: 'info' | 'warning' | 'alert';
  reservationId?: string;
  roomId?: string;
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

export type CustomerProfile = {
  id: string;
  guestName: string;
  cedula: string;
  phone?: string;
  idCardImage?: string;
  rawIdData?: string;
  createdAt: string; // ISO string
};
    
