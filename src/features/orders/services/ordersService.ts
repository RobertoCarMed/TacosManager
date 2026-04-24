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
      ? (rawOrder.items as OrderItem[])
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

export const ordersService = {
  async createOrder(taqueriaId: string, payload: CreateOrderPayload) {
    await getOrdersCollection(taqueriaId).add({
      createdAt: Date.now(),
      plates: payload.plates.map(plate => ({
        id: plate.id,
        items: plate.items.map(item => ({
          availableComplements: item.availableComplements ?? [],
          complements: item.complements ?? [],
          id: item.id,
          name: item.name.trim(),
          price: item.price ?? 0,
          quantity: item.quantity,
        })),
      })),
      // Legacy flat items kept for any external consumer that reads `items`
      items: payload.plates.flatMap(plate =>
        plate.items.map(item => ({
          availableComplements: item.availableComplements ?? [],
          complements: item.complements ?? [],
          id: item.id,
          name: item.name.trim(),
          price: item.price ?? 0,
          quantity: item.quantity,
        })),
      ),
      status: 'pending',
      table: payload.table.trim(),
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
    await getOrdersCollection(taqueriaId).doc(orderId).update({ status });
  },
};
