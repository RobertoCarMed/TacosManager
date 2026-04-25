import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { firestoreDb } from '../../../services/firebase/config';
import {
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
  Plate,
} from '../../../shared/types';

function getOrdersCollection(taqueriaId: string) {
  return firestoreDb
    .collection('taquerias')
    .doc(taqueriaId)
    .collection('orders');
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
  async createOrder(taqueriaId: string, payload: CreateOrderPayload) {
    const plates = buildPlatesWritePayload(payload.plates);
    const flatItems = payload.plates.flatMap(plate =>
      plate.items.map(item => orderItemToWrite(item as OrderItem)),
    );
    await getOrdersCollection(taqueriaId).add({
      createdAt: Date.now(),
      items: flatItems,
      plates,
      status: 'pending',
      table: payload.table.trim(),
    });
  },

  async getOrder(taqueriaId: string, orderId: string): Promise<Order | null> {
    const ref = getOrdersCollection(taqueriaId).doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) {
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
    existing: Order,
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
    const existingPlates = existing.plates.map(plate => withItemNewFlag(plate, false));
    const newPlatesMarked = nonEmptyNew.map(plate => withItemNewFlag(plate, true));
    const merged: Plate[] = [...existingPlates, ...newPlatesMarked];
    const payloadPlates = buildPlatesWritePayload(merged);
    const flatItems = merged.flatMap(plate =>
      plate.items.map(item => orderItemToWrite(item)),
    );
    await getOrdersCollection(taqueriaId).doc(orderId).update({
      items: flatItems,
      plates: payloadPlates,
      status: 'updated',
    });
  },

  subscribeToOrders(
    taqueriaId: string,
    onData: (orders: Order[]) => void,
    onError: (error: Error) => void,
  ) {
    return getOrdersCollection(taqueriaId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const orders = snapshot.docs.map(snapshotItem =>
            mapOrder(snapshotItem.data(), snapshotItem.id),
          );

          onData(orders);
        },
        error => {
          onError(error);
        },
      );
  },

  async updateOrderStatus(
    taqueriaId: string,
    orderId: string,
    status: OrderStatus,
  ) {
    const orderRef = getOrdersCollection(taqueriaId).doc(orderId);
    if (status !== 'preparing') {
      await orderRef.update({ status });
      return;
    }

    const snap = await orderRef.get();
    if (!snap.exists) {
      throw new Error('No se encontró el pedido.');
    }
    const order = mapOrder(snap.data() ?? {}, orderId);
    const sanitized = clearOrderItemHighlights(order);
    await orderRef.update({
      items: sanitized.items,
      plates: sanitized.plates,
      status: 'preparing',
    });
  },
};
