import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {firestoreDb} from '../../../services/firebase/config';
import {CreateOrderPayload, Order, OrderStatus} from '../../../shared/types';

function getOrdersCollection(taqueriaId: string) {
  return firestoreDb.collection('taquerias').doc(taqueriaId).collection('orders');
}

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

  return {
    createdAt,
    id,
    items: Array.isArray(rawOrder.items) ? (rawOrder.items as Order['items']) : [],
    status: (rawOrder.status as OrderStatus) ?? 'pending',
    table: String(rawOrder.table ?? ''),
  };
}

export const ordersService = {
  async createOrder(taqueriaId: string, payload: CreateOrderPayload) {
    await getOrdersCollection(taqueriaId).add({
      createdAt: Date.now(),
      items: payload.items.map(item => ({
        name: item.name.trim(),
        quantity: item.quantity,
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

  async updateOrderStatus(taqueriaId: string, orderId: string, status: OrderStatus) {
    await getOrdersCollection(taqueriaId).doc(orderId).update({status});
  },
};
