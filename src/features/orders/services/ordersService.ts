import {
  FirebaseFirestoreTypes,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { firestoreModularDb } from '../../../services/firebase/config';
import {
  logFirestoreSnapshot,
  logFirestoreSubscriptionEnd,
  logFirestoreSubscriptionError,
  logFirestoreSubscriptionStart,
  runFirestoreOperation,
  toFirestoreUserError,
} from '../../../services/firebase/firestoreOperations';
import {
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
  Plate,
} from '../../../shared/types';

function getOrdersCollection(taqueriaId: string) {
  return collection(
    doc(collection(firestoreModularDb, 'taquerias'), taqueriaId),
    'orders',
  );
}

export type OrderDateFilter = 'today' | '7d' | '1m' | '3m';

type SubscribeOrdersOptions = {
  createdBy?: string;
  dateFilter: OrderDateFilter;
  limitTo?: number;
};

type GetOrderOptions = {
  source?: 'default' | 'server';
};

const ORDER_READ_TIMEOUT_MS = 12000;
const ORDER_WRITE_TIMEOUT_MS = 20000;
const ORDER_TRANSACTION_TIMEOUT_MS = 25000;

function getStartDateMs(filter: OrderDateFilter): number {
  const now = new Date();

  if (filter === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return startOfToday.getTime();
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

/**
 * Normalises a raw Firestore document into the `plates` model.
 *
 * Backward compatibility:
 *   – If the document already has a `plates` array it is used directly.
 *   – If it only has the legacy `items` array the items are wrapped in a
 *     single virtual plate so the rest of the app can treat every order
 *     the same way.
 */
function mapOrder(
  rawOrder: FirebaseFirestoreTypes.DocumentData,
  id: string,
): Order {
  const createdAtValue = rawOrder.createdAt as
    | FirebaseFirestoreTypes.Timestamp
    | number
    | string
    | undefined;

  const createdAt =
    typeof createdAtValue === 'number'
      ? createdAtValue
      : typeof createdAtValue === 'string'
      ? createdAtValue
      : createdAtValue?.toDate?.().getTime() ?? Date.now();

  // --- plates normalisation ---------------------------------------------------
  let plates: Plate[];

  if (Array.isArray(rawOrder.plates) && rawOrder.plates.length > 0) {
    plates = (rawOrder.plates as Plate[]).map((plate, index) => ({
      id: plate.id ?? `plate-${index}`,
      items: Array.isArray(plate.items)
        ? plate.items.map(item => ({
            availableComplements: Array.isArray(item.availableComplements)
              ? item.availableComplements.filter(
                  (complement): complement is string =>
                    typeof complement === 'string',
                )
              : [],
            complements: Array.isArray(item.complements)
              ? item.complements.filter(
                  (complement): complement is string =>
                    typeof complement === 'string',
                )
              : [],
            id: typeof item.id === 'string' ? item.id : undefined,
            isNew: item.isNew === true,
            name: item.name,
            price:
              typeof item.price === 'number' && Number.isFinite(item.price)
                ? item.price
                : 0,
            quantity: item.quantity,
          }))
        : [],
    }));
  } else {
    // Legacy document: wrap flat `items` into a single plate
    const legacyItems: OrderItem[] = Array.isArray(rawOrder.items)
      ? (rawOrder.items as OrderItem[]).map(item => ({
          ...item,
          isNew: item.isNew === true,
        }))
      : [];
    plates =
      legacyItems.length > 0
        ? [{ id: 'plate-legacy', items: legacyItems }]
        : [];
  }

  // Flatten all plate items for the backward-compat `items` accessor
  const items = plates.flatMap(plate => plate.items);

  return {
    createdAt,
    id,
    items,
    plates,
    status: (rawOrder.status as OrderStatus) ?? 'pending',
    table: String(rawOrder.table ?? ''),
  };
}

type ItemWrite = {
  availableComplements: string[];
  complements: string[];
  isNew: boolean;
  name: string;
  price: number;
  quantity: number;
  id?: string;
};

type PlateWrite = {
  id: string;
  items: ItemWrite[];
};

/** Firestore rejects `undefined` — omit optional `id` when not a string. */
function orderItemToWrite(item: OrderItem): ItemWrite {
  const base: ItemWrite = {
    availableComplements: item.availableComplements ?? [],
    complements: item.complements ?? [],
    isNew: item.isNew === true,
    name: item.name.trim(),
    price: item.price ?? 0,
    quantity: item.quantity,
  };
  if (typeof item.id === 'string' && item.id.length > 0) {
    return { ...base, id: item.id };
  }
  return base;
}

function buildPlatesWritePayload(plates: Plate[]): PlateWrite[] {
  return plates.map(plate => ({
    id: plate.id,
    items: plate.items.map(orderItemToWrite),
  }));
}

function withItemNewFlag(plate: Plate, isNew: boolean): Plate {
  return {
    ...plate,
    items: plate.items.map(item => ({
      ...item,
      isNew,
    })),
  };
}

function clearOrderItemHighlights(order: Order): {
  items: ItemWrite[];
  plates: PlateWrite[];
} {
  const normalizedPlates = order.plates.map(plate => withItemNewFlag(plate, false));
  return {
    items: normalizedPlates.flatMap(plate => plate.items.map(orderItemToWrite)),
    plates: buildPlatesWritePayload(normalizedPlates),
  };
}

export const ordersService = {
  async createOrder(
    taqueriaId: string,
    payload: CreateOrderPayload,
    createdBy?: string,
  ) {
    const plates = buildPlatesWritePayload(payload.plates);
    const flatItems = payload.plates.flatMap(plate =>
      plate.items.map(item => orderItemToWrite(item as OrderItem)),
    );

    await runFirestoreOperation(
      'orders.createOrder',
      () =>
        addDoc(getOrdersCollection(taqueriaId), {
          createdAt: Date.now(),
          createdBy: createdBy ?? '',
          items: flatItems,
          plates,
          status: 'pending',
          table: payload.table.trim(),
        }),
      {
        diagnostics: {
          createdBy,
          items: flatItems.length,
          plates: plates.length,
          taqueriaId,
        },
        fallbackMessage: 'No se pudo crear el pedido.',
        timeoutMs: ORDER_WRITE_TIMEOUT_MS,
      },
    );
  },

  async getOrder(
    taqueriaId: string,
    orderId: string,
    options: GetOrderOptions = {},
  ): Promise<Order | null> {
    const ref = doc(getOrdersCollection(taqueriaId), orderId);
    const source = options.source ?? 'default';
    const snap = await runFirestoreOperation(
      source === 'server' ? 'orders.getOrder.server' : 'orders.getOrder',
      () => (source === 'server' ? getDocFromServer(ref) : getDoc(ref)),
      {
        diagnostics: {
          orderId,
          source,
          taqueriaId,
        },
        fallbackMessage: 'No se pudo cargar el pedido.',
        timeoutMs: ORDER_READ_TIMEOUT_MS,
      },
    );

    if (__DEV__) {
      console.log('[Firestore] orders.getOrder metadata', {
        fromCache: snap.metadata.fromCache,
        hasPendingWrites: snap.metadata.hasPendingWrites,
        orderId,
        source,
      });
    }

    if (!snap.exists()) {
      return null;
    }
    return mapOrder(snap.data() ?? {}, orderId);
  },

  /**
   * Appends new plates to the existing order document (does not create a new order).
   * Merged flat `items` matches `plates` for backward compatibility.
   */
  async appendPlatesToOrder(
    taqueriaId: string,
    orderId: string,
    newPlates: Plate[],
  ) {
    if (newPlates.length === 0) {
      return;
    }
    const nonEmptyNew = newPlates.filter(
      p => p.items && p.items.length > 0,
    ) as Plate[];
    if (nonEmptyNew.length === 0) {
      return;
    }

    const orderRef = doc(getOrdersCollection(taqueriaId), orderId);
    await runFirestoreOperation(
      'orders.appendPlatesToOrder.transaction',
      () =>
        runTransaction(firestoreModularDb, async transaction => {
          const snap = await transaction.get(orderRef);
          if (!snap.exists()) {
            throw new Error('No se encontro el pedido.');
          }

          const existing = mapOrder(snap.data() ?? {}, orderId);
          const existingPlates = existing.plates.map(plate =>
            withItemNewFlag(plate, false),
          );
          const newPlatesMarked = nonEmptyNew.map(plate =>
            withItemNewFlag(plate, true),
          );
          const merged: Plate[] = [...existingPlates, ...newPlatesMarked];
          const payloadPlates = buildPlatesWritePayload(merged);
          const flatItems = merged.flatMap(plate =>
            plate.items.map(item => orderItemToWrite(item)),
          );

          transaction.update(orderRef, {
            items: flatItems,
            plates: payloadPlates,
            status: 'updated',
          });
        }),
      {
        diagnostics: {
          newPlates: nonEmptyNew.length,
          orderId,
          taqueriaId,
        },
        fallbackMessage: 'No se pudieron guardar los cambios del pedido.',
        timeoutMs: ORDER_TRANSACTION_TIMEOUT_MS,
      },
    );
  },

  subscribeToOrders(
    taqueriaId: string,
    options: SubscribeOrdersOptions,
    onData: (orders: Order[]) => void,
    onError: (error: Error) => void,
  ) {
    const startDateMs = getStartDateMs(options.dateFilter);
    const ordersRef = getOrdersCollection(taqueriaId);
    const maxResults = options.limitTo ?? 100;
    const ordersQuery = options.createdBy
      ? query(
          ordersRef,
          where('createdAt', '>=', startDateMs),
          where('createdBy', '==', options.createdBy),
          orderBy('createdAt', 'desc'),
          limit(maxResults),
        )
      : query(
          ordersRef,
          where('createdAt', '>=', startDateMs),
          orderBy('createdAt', 'desc'),
          limit(maxResults),
        );
    const subscriptionName = options.createdBy
      ? 'orders.subscribeToOrders.waiter'
      : 'orders.subscribeToOrders.kitchen';
    const subscriptionStartedAt = logFirestoreSubscriptionStart(
      subscriptionName,
      {
        createdBy: options.createdBy,
        dateFilter: options.dateFilter,
        limitTo: maxResults,
        startDateMs,
        taqueriaId,
      },
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      snapshot => {
        logFirestoreSnapshot(subscriptionName, subscriptionStartedAt, snapshot);
        const orders = snapshot.docs.map(snapshotItem =>
          mapOrder(snapshotItem.data(), snapshotItem.id),
        );

        onData(orders);
      },
      error => {
        logFirestoreSubscriptionError(subscriptionName, error);
        onError(
          toFirestoreUserError(error, 'No se pudieron sincronizar los pedidos.'),
        );
      },
    );

    return () => {
      logFirestoreSubscriptionEnd(subscriptionName);
      unsubscribe();
    };
  },

  async updateOrderStatus(
    taqueriaId: string,
    orderId: string,
    status: OrderStatus,
  ) {
    const orderRef = doc(getOrdersCollection(taqueriaId), orderId);
    if (status !== 'preparing') {
      await runFirestoreOperation(
        'orders.updateOrderStatus',
        () => updateDoc(orderRef, {status}),
        {
          diagnostics: {
            orderId,
            status,
            taqueriaId,
          },
          fallbackMessage: 'No se pudo actualizar el estado del pedido.',
          timeoutMs: ORDER_WRITE_TIMEOUT_MS,
        },
      );
      return;
    }

    await runFirestoreOperation(
      'orders.updateOrderStatus.preparing.transaction',
      () =>
        runTransaction(firestoreModularDb, async transaction => {
          const snap = await transaction.get(orderRef);
          if (!snap.exists()) {
            throw new Error('No se encontro el pedido.');
          }

          const order = mapOrder(snap.data() ?? {}, orderId);
          const sanitized = clearOrderItemHighlights(order);
          transaction.update(orderRef, {
            items: sanitized.items,
            plates: sanitized.plates,
            status: 'preparing',
          });
        }),
      {
        diagnostics: {
          orderId,
          status,
          taqueriaId,
        },
        fallbackMessage: 'No se pudo actualizar el estado del pedido.',
        timeoutMs: ORDER_TRANSACTION_TIMEOUT_MS,
      },
    );
  },
};
