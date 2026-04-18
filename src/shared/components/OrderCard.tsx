import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {theme} from '../constants';
import {Order} from '../types';
import {formatOrderTime} from '../utils';

type OrderCardProps = {
  order: Order;
  footer?: React.ReactNode;
};

const statusLabels: Record<Order['status'], string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo',
};

const statusColors: Record<Order['status'], string> = {
  completed: theme.colors.success,
  pending: theme.colors.warning,
  preparing: theme.colors.accent,
  ready: theme.colors.primary,
};

export function OrderCard({footer, order}: OrderCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.table}>Mesa {order.table}</Text>
          <Text style={styles.time}>{formatOrderTime(order.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {backgroundColor: `${statusColors[order.status]}22`},
          ]}>
          <Text style={[styles.statusText, {color: statusColors[order.status]}]}>
            {statusLabels[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {order.items.map((item, index) => (
          <Text key={item.id ?? `${item.name}-${index}`} style={styles.itemText}>
            {item.quantity}x {item.name}
          </Text>
        ))}
      </View>

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
  itemText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  statusPill: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  table: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
});
