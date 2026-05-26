import React, {useCallback, useRef, useState} from 'react';
import {Animated, ScrollView, StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {Order} from '../../../shared/types';
import {getOrderDisplayLabel} from '../../../shared/utils';

type KitchenOrderCardProps = {
  order: Order;
  onAdvanceStatus: (
    orderId: string,
    status: Order['status'],
  ) => Promise<void> | void;
};

const statusLabels: Record<Order['status'], string> = {
  CANCELLED: 'CANCELADO',
  DELIVERED: 'ENTREGADO',
  PENDING: 'PENDIENTE',
  PREPARING: 'PREPARANDO',
  READY: 'LISTO',
};

const statusColors: Record<Order['status'], {accent: string; bg: string; text: string}> = {
  CANCELLED: {accent: theme.colors.danger, bg: '#FFEBEE', text: theme.colors.danger},
  DELIVERED: {accent: theme.colors.success, bg: '#E8F5EC', text: theme.colors.success},
  PENDING: {accent: theme.colors.warning, bg: '#FFF4DE', text: theme.colors.warning},
  PREPARING: {accent: '#1E5FAF', bg: '#E9F2FF', text: '#1E5FAF'},
  READY: {accent: theme.colors.success, bg: '#E8F5EC', text: theme.colors.success},
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
  if (status === 'PENDING') {
    return {
      label: 'Marcar preparando',
      nextStatus: 'PREPARING' as const,
      variant: 'primary' as const,
    };
  }

  if (status === 'PREPARING') {
    return {
      label: 'Marcar listo',
      nextStatus: 'READY' as const,
      variant: 'primary' as const,
    };
  }

  return {
    label: 'Entregado',
    nextStatus: 'DELIVERED' as const,
    variant: 'secondary' as const,
  };
}

function getComplementColumns(item: Order['items'][number]) {
  if (
    Array.isArray(item.availableComplements) &&
    item.availableComplements.length > 0
  ) {
    return item.availableComplements.slice(0, 3);
  }

  if (Array.isArray(item.complements) && item.complements.length > 0) {
    return item.complements.slice(0, 3);
  }

  return [];
}

function sortItemsByNewFlag(items: Order['items']) {
  return items
    .map((item, originalIndex) => ({item, originalIndex}))
    .sort((a, b) => {
      if (a.item.isNew === b.item.isNew) {
        return a.originalIndex - b.originalIndex;
      }

      return a.item.isNew ? -1 : 1;
    });
}

function sortPlatesByNewFlag(plates: Order['plates']) {
  return plates
    .map((plate, originalIndex) => ({originalIndex, plate}))
    .sort((a, b) => {
      const aIsNew = a.plate.items.some(item => item.isNew === true);
      const bIsNew = b.plate.items.some(item => item.isNew === true);

      if (aIsNew === bIsNew) {
        return a.originalIndex - b.originalIndex;
      }

      return aIsNew ? -1 : 1;
    });
}

export function OrderCard({onAdvanceStatus, order}: KitchenOrderCardProps) {
  const action = getActionForStatus(order.status);
  const hasPlates = order.plates && order.plates.length > 0;
  const sortedPlates = hasPlates ? sortPlatesByNewFlag(order.plates) : [];
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const colors = statusColors[order.status];

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
  }, [
    action.nextStatus,
    cardOpacity,
    isTransitioning,
    onAdvanceStatus,
    order.id,
  ]);

  const renderItem = (item: Order['items'][number], itemKey: string) => {
    const selectedComplements = item.complements ?? [];
    const complementColumns = getComplementColumns(item);

    return (
      <View
        key={itemKey}
        style={[styles.itemRow, item.isNew ? styles.itemRowUpdated : null]}>
        <Text style={styles.itemText}>
          <Text style={styles.quantityText}>{item.quantity}x </Text>
          {item.name}
        </Text>

        {complementColumns.length > 0 ? (
          <View style={styles.complementsRow}>
            {complementColumns.map(complement => {
              const isSelected = selectedComplements.includes(complement);

              return (
                <View
                  key={`${itemKey}-${complement}`}
                  style={styles.complementPill}>
                  <Text
                    style={[
                      styles.complementIndicator,
                      isSelected ? styles.indicatorOn : null,
                    ]}>
                    {isSelected ? '✔' : '✖'}
                  </Text>
                  <Text style={styles.complementLabel}>{complement}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.card, {opacity: cardOpacity}]}>
      {/* Status accent bar */}
      <View style={[styles.accentBar, {backgroundColor: colors.accent}]} />

      {/* Card content */}
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.tableText} numberOfLines={1}>
              {getOrderDisplayLabel(order)}
            </Text>
            <Text style={styles.timeText}>{getOrderTime(order.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: colors.bg}]}>
            <Text style={[styles.statusText, {color: colors.text}]}>
              {statusLabels[order.status]}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}>
          {hasPlates ? (
            sortedPlates.map(({plate, originalIndex: plateOriginalIndex}) => {
              const sortedPlateItems = sortItemsByNewFlag(plate.items);

              return (
                <View
                  key={plate.id ?? `${order.id}-plate-${plateOriginalIndex}`}
                  style={styles.plateBlock}>
                  <Text style={styles.plateTitle}>
                    PLATO {plateOriginalIndex + 1}
                  </Text>
                  {sortedPlateItems.map(({item}, sortedIndex) => {
                    const itemKey = `${order.id}-${plate.id ?? plateOriginalIndex}-${sortedIndex}-${item.name}`;
                    return (
                      <React.Fragment key={itemKey}>
                        {renderItem(item, itemKey)}
                      </React.Fragment>
                    );
                  })}
                </View>
              );
            })
          ) : (
            <View style={styles.plateBlock}>
              {sortItemsByNewFlag(order.items).map(({item}, sortedIndex) => {
                const itemKey = `${order.id}-flat-${sortedIndex}-${item.name}`;
                return (
                  <React.Fragment key={itemKey}>
                    {renderItem(item, itemKey)}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            disabled={isTransitioning}
            label={action.label}
            onPress={handleAdvanceStatus}
            size="large"
            variant={action.variant}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    borderBottomLeftRadius: theme.radius.lg,
    borderTopLeftRadius: theme.radius.lg,
    width: 6,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    elevation: 4,
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  complementIndicator: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  complementLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  complementPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
  },
  complementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  footer: {
    marginTop: theme.spacing.sm,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  indicatorOn: {
    color: theme.colors.success,
  },
  itemRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  itemRowUpdated: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
  },
  itemText: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 26,
  },
  plateBlock: {
    backgroundColor: theme.colors.muted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  plateTitle: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quantityText: {
    color: theme.colors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableText: {
    color: theme.colors.textPrimary,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
