import firestore, {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {CreateOrderPayload, Order, OrderStatus} from '../../shared/types';
import {firestoreDb} from './config';

function getOrdersCollection(taqueriaId: string) {
  // Firestore shape required by the product: taquerias/{taqueriaId}/orders/{orderId}
  return firestoreDb.collection('taquerias').doc(taqueriaId).collection('orders');
}

function mapOrder(
  rawOrder: FirebaseFirestoreTypes.DocumentData,
  id: string,
): Order {
  const createdAtValue = rawOrder.createdAt as
    | FirebaseFirestoreTypes.Timestamp
    | string
    | undefined;

  const createdAt =
    typeof createdAtValue === 'string'
      ? createdAtValue
      : createdAtValue?.toDate?.().toISOString() ?? new Date().toISOString();

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
      createdAt: firestore.FieldValue.serverTimestamp(),
      items: payload.items,
      status: 'pending',
      table: payload.table,
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
