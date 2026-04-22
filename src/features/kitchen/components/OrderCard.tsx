import React, {useCallback, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {Order} from '../../../shared/types';

type KitchenOrderCardProps = {
  order: Order;
  onAdvanceStatus: (orderId: string, status: Order['status']) => Promise<void> | void;
};

const statusLabels: Record<Order['status'], string> = {
  completed: 'COMPLETADO',
  pending: 'PENDIENTE',
  preparing: 'PREPARANDO',
  ready: 'LISTO',
};

const statusColors: Record<Order['status'], {bg: string; text: string}> = {
  completed: {bg: '#E8F5EC', text: theme.colors.success},
  pending: {bg: '#FFF4DE', text: theme.colors.warning},
  preparing: {bg: '#E9F2FF', text: '#1E5FAF'},
  ready: {bg: '#E8F5EC', text: theme.colors.success},
};

function getOrderTime(createdAt: string | number) {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionForStatus(status: Order['status']) {
  if (status === 'pending') {
    return {label: 'Marcar preparando', nextStatus: 'preparing' as const, variant: 'primary' as const};
  }

  if (status === 'preparing') {
    return {label: 'Marcar listo', nextStatus: 'ready' as const, variant: 'primary' as const};
  }

  return {label: 'Entregado', nextStatus: 'completed' as const, variant: 'secondary' as const};
}

export function OrderCard({onAdvanceStatus, order}: KitchenOrderCardProps) {
  const action = getActionForStatus(order.status);
  const hasPlates = order.plates && order.plates.length > 0;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const orderType = (order as Order & {orderType?: string; type?: string}).orderType ??
    (order as Order & {orderType?: string; type?: string}).type;

  const handleAdvanceStatus = useCallback(() => {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);
    Animated.timing(cardOpacity, {
      duration: 280,
      toValue: 0,
      useNativeDriver: true,
    }).start(async () => {
      try {
        await onAdvanceStatus(order.id, action.nextStatus);
      } finally {
        requestAnimationFrame(() => {
          Animated.timing(cardOpacity, {
            duration: 280,
            toValue: 1,
            useNativeDriver: true,
          }).start(() => {
            setIsTransitioning(false);
          });
        });
      }
    });
  }, [action.nextStatus, cardOpacity, isTransitioning, onAdvanceStatus, order.id]);

  return (
    <Animated.View style={[styles.card, {opacity: cardOpacity}]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.tableText}>Mesa {order.table}</Text>
          <Text style={styles.timeText}>{getOrderTime(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: statusColors[order.status].bg}]}>
          <Text style={[styles.statusText, {color: statusColors[order.status].text}]}>
            {statusLabels[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {orderType ? <Text style={styles.orderTypeText}>{orderType}</Text> : null}
        {hasPlates ? (
          <View style={styles.platesContainer}>
            {order.plates.map((plate, plateIndex) => (
              <View key={plate.id ?? `plate-${plateIndex}`} style={styles.plateBlock}>
                <Text style={styles.plateTitle}>PLATO {plateIndex + 1}</Text>
                {plate.items.map((item, itemIndex) => (
                  <Text key={item.id ?? `${item.name}-${itemIndex}`} style={styles.itemText}>
                    {item.quantity}x {item.name}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.plateBlock}>
            {order.items.map((item, itemIndex) => (
              <Text key={item.id ?? `${item.name}-${itemIndex}`} style={styles.itemText}>
                {item.quantity}x {item.name}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <AppButton
          disabled={isTransitioning}
          label={action.label}
          onPress={handleAdvanceStatus}
          size="large"
          variant={action.variant}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    elevation: 4,
    flex: 1,
    minHeight: 320,
    padding: theme.spacing.lg,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  footer: {
    marginTop: theme.spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  itemText: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 26,
  },
  orderTypeText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  plateBlock: {
    backgroundColor: theme.colors.muted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  platesContainer: {
    gap: theme.spacing.md,
  },
  plateTitle: {
    color: theme.colors.accent,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusBadge: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tableText: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
});
