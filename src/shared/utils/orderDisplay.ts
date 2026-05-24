import {Order} from '../types';

const MAX_DELIVERY_ADDRESS_LENGTH = 20;

export function getOrderDisplayLabel(order: Pick<Order, 'type' | 'reference' | 'deliveryAddress' | 'tableNumber'>): string {
  const type = order.type ?? 'DINE_IN';

  if (type === 'DELIVERY') {
    if (order.reference) {
      return `🛵 ${order.reference} - Enviar`;
    }
    const address = order.deliveryAddress ?? '';
    return address.length > MAX_DELIVERY_ADDRESS_LENGTH
      ? `🛵 ${address.slice(0, MAX_DELIVERY_ADDRESS_LENGTH)}...`
      : `🛵 ${address}`;
  }

  if (type === 'TAKEAWAY') {
    return `🥡 ${order.reference ?? order.tableNumber ?? ''}`;
  }

  return `🍽 ${order.reference ?? order.tableNumber ?? ''}`;
}
