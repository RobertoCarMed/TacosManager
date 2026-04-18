export type UserRole = 'waiter' | 'cook';

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
  taqueriaId: string;
  email?: string;
  businessAddress?: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export type OrderItem = {
  id?: string;
  name: string;
  quantity: number;
};

export type Order = {
  id: string;
  table: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string | number;
};

export type CreateOrderPayload = {
  table: string;
  items: OrderItem[];
};
