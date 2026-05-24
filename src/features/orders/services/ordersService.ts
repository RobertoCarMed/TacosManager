import {apiClient} from '../../../services/api/client';
import {productService} from '../../products/services/productService';
import {
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
  Plate,
} from '../../../shared/types';

export type OrderDateFilter = 'today' | '7d' | '1m' | '3m';

type SubscribeOrdersOptions = {
  createdBy?: string;
  dateFilter: OrderDateFilter;
  limitTo?: number;
  taqueriaId?: string;
};

// ─── API shapes ───────────────────────────────────────────────────────────────

export type ApiItem = {
  id: string;
  productId: string;
  quantity: number;
  selectedComplements: string[];
  notes?: string;
  isNew: boolean;
  createdInRevision: number;
  createdAt: string;
};

export type ApiPlate = {
  id: string;
  plateNumber: number;
  isClosed: boolean;
  createdInRevision: number;
  createdAt: string;
  items: ApiItem[];
};

export type ApiOrder = {
  id: string;
  taqueriaId: string;
  waiterId: string;
  tableNumber: string;
  status: string;
  revision: number;
  priorityTimestamp: string;
  createdAt: string;
  updatedAt: string;
  plates: ApiPlate[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStartDateMs(filter: OrderDateFilter): number {
  const now = new Date();

  if (filter === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }

  if (filter === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.getTime();
  }

  if (filter === '1m') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.getTime();
  }

  const d = new Date(now);
  d.setMonth(d.getMonth() - 3);
  return d.getTime();
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }
  const axiosError = error as {response?: {data?: {message?: string | string[]}}};
  const {message} = axiosError.response?.data ?? {};
  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }
  return typeof message === 'string' ? message : fallback;
}

function mapApiOrder(apiOrder: ApiOrder): Order {
  const products = productService.getCachedProducts(apiOrder.taqueriaId);
  const productMap = new Map(products.map(p => [p.id, p]));

  const plates: Plate[] = apiOrder.plates.map(apiPlate => ({
    id: apiPlate.id,
    plateNumber: apiPlate.plateNumber,
    isClosed: apiPlate.isClosed,
    createdInRevision: apiPlate.createdInRevision,
    createdAt: apiPlate.createdAt,
    items: apiPlate.items.map((apiItem): OrderItem => {
      const product = productMap.get(apiItem.productId);
      return {
        id: apiItem.id,
        productId: apiItem.productId,
        name: product?.name ?? apiItem.productId,
        price: product?.price,
        quantity: apiItem.quantity,
        selectedComplements: apiItem.selectedComplements,
        complements: apiItem.selectedComplements,
        availableComplements: product?.complements ?? [],
        notes: apiItem.notes,
        isNew: apiItem.isNew,
        createdInRevision: apiItem.createdInRevision,
        createdAt: apiItem.createdAt,
      };
    }),
  }));

  const items = plates.flatMap(plate => plate.items);

  return {
    id: apiOrder.id,
    taqueriaId: apiOrder.taqueriaId,
    waiterId: apiOrder.waiterId,
    tableNumber: apiOrder.tableNumber,
    table: apiOrder.tableNumber,
    status: apiOrder.status as OrderStatus,
    revision: apiOrder.revision,
    priorityTimestamp: apiOrder.priorityTimestamp,
    plates,
    items,
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

type AppendPlatesPayload = Array<{
  plateNumber: number;
  items: Array<{
    productId: string;
    quantity: number;
    selectedComplements: string[];
    notes?: string;
  }>;
}>;

export const ordersService = {
  parseOrder(apiOrder: ApiOrder): Order {
    return mapApiOrder(apiOrder);
  },

  async createOrder(payload: CreateOrderPayload): Promise<void> {
    try {
      await apiClient.post('/orders', payload);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'No se pudo crear el pedido.'),
      );
    }
  },

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const {data} = await apiClient.get<ApiOrder>(`/orders/${orderId}`);
      return mapApiOrder(data);
    } catch (error) {
      const status = (error as {response?: {status?: number}}).response?.status;
      if (status === 404) {
        return null;
      }
      throw new Error(
        extractErrorMessage(error, 'No se pudo cargar el pedido.'),
      );
    }
  },

  async appendPlatesToOrder(
    orderId: string,
    plates: AppendPlatesPayload,
  ): Promise<void> {
    if (plates.length === 0) {
      return;
    }
    try {
      await apiClient.patch(`/orders/${orderId}`, {plates});
    } catch (error) {
      throw new Error(
        extractErrorMessage(
          error,
          'No se pudieron guardar los cambios del pedido.',
        ),
      );
    }
  },

  subscribeToOrders(
    options: SubscribeOrdersOptions,
    onData: (orders: Order[]) => void,
    onError: (error: Error) => void,
  ): () => void {
    const startDateMs = getStartDateMs(options.dateFilter);
    let cancelled = false;

    const ordersRequest = apiClient.get<ApiOrder[]>('/orders');
    const cacheWarm = options.taqueriaId
      ? productService.fetchProducts(options.taqueriaId, {forceRefresh: false})
      : Promise.resolve([]);

    Promise.all([ordersRequest, cacheWarm])
      .then(([{data}]) => {
        if (cancelled) {
          return;
        }
        const orders = data
          .map(mapApiOrder)
          .filter(
            order => new Date(order.createdAt).getTime() >= startDateMs,
          );
        onData(orders);
      })
      .catch(error => {
        if (cancelled) {
          return;
        }
        onError(
          new Error(
            extractErrorMessage(
              error,
              'No se pudieron sincronizar los pedidos.',
            ),
          ),
        );
      });

    return () => {
      cancelled = true;
    };
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, {status});
    } catch (error) {
      throw new Error(
        extractErrorMessage(
          error,
          'No se pudo actualizar el estado del pedido.',
        ),
      );
    }
  },
};
