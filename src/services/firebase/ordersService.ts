import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  CreateOrderPayload,
  Order,
  OrderStatus,
  Plate,
} from '../../shared/types';
import { firestoreDb } from './config';

function getOrdersCollection(taqueriaId: string) {
  return firestoreDb
    .collection('taquerias')
    .doc(taqueriaId)
    .collection('orders');
}

function mapOrder(
  rawOrder: FirebaseFirestoreTypes.DocumentData,
  id: string,
): Order {
  const createdAtValue = rawOrder.createdAt as
    | FirebaseFirestoreTypes.Timestamp
    | string
    | number
    | undefined;

  const createdAt =
    typeof createdAtValue === 'string'
      ? createdAtValue
      : typeof createdAtValue === 'number'
      ? createdAtValue
      : createdAtValue?.toDate?.().getTime() ?? Date.now();

  const plates: Plate[] = Array.isArray(rawOrder.plates)
    ? (rawOrder.plates as Plate[]).map((plate, index) => ({
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
              name: String(item.name ?? ''),
              price:
                typeof item.price === 'number' && Number.isFinite(item.price)
                  ? item.price
                  : 0,
              quantity: Number(item.quantity ?? 0),
            }))
          : [],
      }))
    : [];

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
      items: payload.plates.flatMap(plate =>
        plate.items.map(item => ({
          availableComplements: item.availableComplements ?? [],
          complements: item.complements ?? [],
          name: item.name.trim(),
          price: item.price ?? 0,
          quantity: item.quantity,
        })),
      ),
      plates: payload.plates.map(plate => ({
        id: plate.id,
        items: plate.items.map(item => ({
          availableComplements: item.availableComplements ?? [],
          complements: item.complements ?? [],
          name: item.name.trim(),
          price: item.price ?? 0,
          quantity: item.quantity,
        })),
      })),
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
