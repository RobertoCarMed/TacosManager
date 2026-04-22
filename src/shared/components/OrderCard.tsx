import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {theme} from '../constants';
import {Order} from '../types';
import {formatOrderTime} from '../utils';

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

export function OrderCard({footer, order, variant = 'default'}: OrderCardProps) {
  const hasPlates = order.plates && order.plates.length > 0;
  const isKitchen = variant === 'kitchen';

  return (
    <View style={[styles.card, isKitchen ? styles.cardKitchen : null]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.table, isKitchen ? styles.tableKitchen : null]}>Mesa {order.table}</Text>
          <Text style={[styles.time, isKitchen ? styles.timeKitchen : null]}>
            {formatOrderTime(order.createdAt)}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            isKitchen ? styles.statusPillKitchen : null,
            {backgroundColor: `${statusColors[order.status]}22`},
          ]}>
          <Text
            style={[
              styles.statusText,
              isKitchen ? styles.statusTextKitchen : null,
              {color: statusColors[order.status]},
            ]}>
            {statusLabels[order.status]}
          </Text>
        </View>
      </View>

      {hasPlates ? (
        <View style={[styles.platesContainer, isKitchen ? styles.platesContainerKitchen : null]}>
          {order.plates.map((plate, plateIndex) => (
            <View
              key={plate.id ?? `plate-${plateIndex}`}
              style={[styles.plateSection, isKitchen ? styles.plateSectionKitchen : null]}>
              <Text style={[styles.plateLabel, isKitchen ? styles.plateLabelKitchen : null]}>
                Plato {plateIndex + 1}
              </Text>
              <View style={[styles.itemsContainer, isKitchen ? styles.itemsContainerKitchen : null]}>
                {plate.items.map((item, itemIndex) => (
                  <Text
                    key={item.id ?? `${item.name}-${itemIndex}`}
                    style={[styles.itemText, isKitchen ? styles.itemTextKitchen : null]}>
                    {item.quantity}x {item.name}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        // Fallback for orders with no plates (shouldn't happen, but safety net)
        <View style={[styles.itemsContainer, isKitchen ? styles.itemsContainerKitchen : null]}>
          {order.items.map((item, index) => (
            <Text
              key={item.id ?? `${item.name}-${index}`}
              style={[styles.itemText, isKitchen ? styles.itemTextKitchen : null]}>
              {item.quantity}x {item.name}
            </Text>
          ))}
        </View>
      )}

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
