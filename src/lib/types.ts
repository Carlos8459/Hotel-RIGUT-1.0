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
