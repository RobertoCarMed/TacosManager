export type UserRole = 'waiter' | 'cook';

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
  taqueriaId: string;
  email?: string;
  businessAddress?: string;
};

export type ApiTaqueria = {
  id: string;
  name: string;
  restaurantCode: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
};

export type OrderStatus =
  | 'UPDATED'
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderItem = {
  id?: string;
  productId: string;
  name: string;
  price?: number;
  quantity: number;
  selectedComplements: string[];
  /** @deprecated Use selectedComplements */
  complements?: string[];
  availableComplements?: string[];
  notes?: string;
  isNew?: boolean;
  createdInRevision?: number;
  createdAt?: string;
};

export type Plate = {
  id: string;
  plateNumber: number;
  isClosed?: boolean;
  createdInRevision?: number;
  createdAt?: string;
  items: OrderItem[];
};

export type Order = {
  id: string;
  tableNumber: string;
  /** @deprecated Use tableNumber */
  table: string;
  plates: Plate[];
  /** @deprecated Use plates[].items */
  items: OrderItem[];
  status: OrderStatus;
  revision?: number;
  priorityTimestamp?: string;
  waiterId?: string;
  taqueriaId?: string;
  createdAt: string | number;
  updatedAt?: string;
};

export type CreateOrderPayload = {
  tableNumber: string;
  plates: Array<{
    plateNumber: number;
    items: Array<{
      productId: string;
      quantity: number;
      selectedComplements: string[];
      notes?: string;
    }>;
  }>;
};
