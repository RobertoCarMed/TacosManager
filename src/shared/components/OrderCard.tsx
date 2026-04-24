import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants';
import { Order } from '../types';
import { formatOrderTime } from '../utils';

type OrderCardProps = {
  order: Order;
  footer?: React.ReactNode;
  variant?: 'default' | 'kitchen';
};

const statusLabels: Record<Order['status'], string> = {
  completed: 'COMPLETADO',
  pending: 'PENDIENTE',
  preparing: 'PREPARANDO',
  ready: 'LISTO',
};

const statusColors: Record<Order['status'], string> = {
  completed: theme.colors.success,
  pending: theme.colors.warning,
  preparing: theme.colors.accent,
  ready: theme.colors.primary,
};

function getSafePrice(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function OrderCard({
  footer,
  order,
  variant = 'default',
}: OrderCardProps) {
  const hasPlates = order.plates && order.plates.length > 0;
  const isKitchen = variant === 'kitchen';
  const itemsForTotal = hasPlates
    ? order.plates.flatMap(plate => plate.items)
    : order.items;
  const orderTotal = itemsForTotal.reduce(
    (sum, item) => sum + getSafePrice(item.price) * item.quantity,
    0,
  );

  return (
    <View style={[styles.card, isKitchen ? styles.cardKitchen : null]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.table, isKitchen ? styles.tableKitchen : null]}>
            Mesa {order.table}
          </Text>
          <Text style={[styles.time, isKitchen ? styles.timeKitchen : null]}>
            {formatOrderTime(order.createdAt)}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            isKitchen ? styles.statusPillKitchen : null,
            { backgroundColor: `${statusColors[order.status]}22` },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isKitchen ? styles.statusTextKitchen : null,
              { color: statusColors[order.status] },
            ]}
          >
            {statusLabels[order.status]}
          </Text>
        </View>
      </View>

      {hasPlates ? (
        <View
          style={[
            styles.platesContainer,
            isKitchen ? styles.platesContainerKitchen : null,
          ]}
        >
          {order.plates.map((plate, plateIndex) => (
            <View
              key={plate.id ?? `plate-${plateIndex}`}
              style={[
                styles.plateSection,
                isKitchen ? styles.plateSectionKitchen : null,
              ]}
            >
              <Text
                style={[
                  styles.plateLabel,
                  isKitchen ? styles.plateLabelKitchen : null,
                ]}
              >
                Plato {plateIndex + 1}
              </Text>
              <View
                style={[
                  styles.itemsContainer,
                  isKitchen ? styles.itemsContainerKitchen : null,
                ]}
              >
                {plate.items.map((item, itemIndex) => {
                  const unitPrice = getSafePrice(item.price);
                  const subtotal = unitPrice * item.quantity;

                  if (isKitchen) {
                    return (
                      <Text
                        key={item.id ?? `${item.name}-${itemIndex}`}
                        style={[
                          styles.itemText,
                          isKitchen ? styles.itemTextKitchen : null,
                        ]}
                      >
                        {item.quantity}x {item.name}
                      </Text>
                    );
                  }

                  return (
                    <View
                      key={item.id ?? `${item.name}-${itemIndex}`}
                      style={styles.itemRowWaiter}
                    >
                      <Text style={styles.itemLeftText}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.itemRightText}>
                        {formatCurrency(unitPrice)} | {formatCurrency(subtotal)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : (
        // Fallback for orders with no plates (shouldn't happen, but safety net)
        <View
          style={[
            styles.itemsContainer,
            isKitchen ? styles.itemsContainerKitchen : null,
          ]}
        >
          {order.items.map((item, index) => {
            const unitPrice = getSafePrice(item.price);
            const subtotal = unitPrice * item.quantity;

            if (isKitchen) {
              return (
                <Text
                  key={item.id ?? `${item.name}-${index}`}
                  style={[
                    styles.itemText,
                    isKitchen ? styles.itemTextKitchen : null,
                  ]}
                >
                  {item.quantity}x {item.name}
                </Text>
              );
            }

            return (
              <View
                key={item.id ?? `${item.name}-${index}`}
                style={styles.itemRowWaiter}
              >
                <Text style={styles.itemLeftText}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemRightText}>
                  {formatCurrency(unitPrice)} | {formatCurrency(subtotal)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {!isKitchen ? (
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(orderTotal)}</Text>
        </View>
      ) : null}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cardKitchen: {
    borderWidth: 2,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  footer: {
    gap: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemsContainer: {
    gap: theme.spacing.xs,
  },
  itemsContainerKitchen: {
    gap: theme.spacing.sm,
  },
  itemText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  itemLeftText: {
    color: theme.colors.textPrimary,
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 24,
    marginRight: theme.spacing.md,
  },
  itemRightText: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  itemRowWaiter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTextKitchen: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
  },
  plateLabel: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  plateLabelKitchen: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  platesContainer: {
    gap: theme.spacing.md,
  },
  platesContainerKitchen: {
    gap: theme.spacing.lg,
  },
  plateSection: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  plateSectionKitchen: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  statusPill: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  statusPillKitchen: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusTextKitchen: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  table: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  tableKitchen: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  totalLabel: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  totalSection: {
    alignItems: 'flex-end',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: 2,
    paddingTop: theme.spacing.sm,
  },
  totalValue: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  timeKitchen: {
    fontSize: 15,
    marginTop: theme.spacing.xs,
  },
});
