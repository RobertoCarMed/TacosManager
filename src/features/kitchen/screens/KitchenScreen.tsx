import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  FlatList,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {KitchenStackParamList} from '../../../navigation/types';
import {Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {Order} from '../../../shared/types';
import {OrderCard} from '../components/OrderCard';
import {useOrders} from '../../orders';
import {OrderDateFilter} from '../../orders/services/ordersService';
import {orderDateFilterOptions} from '../../orders/constants/dateFilters';

type Props = NativeStackScreenProps<KitchenStackParamList, 'KitchenDashboard'>;
type GridPlaceholder = {id: string; isPlaceholder: true};

const statusPriority: Record<Order['status'], number> = {
  UPDATED: 1,
  PENDING: 2,
  PREPARING: 3,
  READY: 4,
  DELIVERED: 5,
  CANCELLED: 6,
};

const layoutReflowAnimation = {
  create: {
    duration: 280,
    property: LayoutAnimation.Properties.scaleXY,
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    duration: 280,
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  duration: 280,
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
};

function toTimestamp(value: string | number) {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function KitchenScreen({navigation}: Props) {
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>('today');
  const {error, orders, updateOrderStatus} = useOrders({dateFilter});
  const [animatedOrders, setAnimatedOrders] = useState(orders);
  const hasSyncedInitialOrders = useRef(false);

  useLayoutEffect(() => {
    if (!hasSyncedInitialOrders.current) {
      hasSyncedInitialOrders.current = true;
      setAnimatedOrders(orders);
      return;
    }

    LayoutAnimation.configureNext(layoutReflowAnimation);
    setAnimatedOrders(orders);
  }, [orders]);

  const numColumns = 2;

  const activeOrders = useMemo(() => {
    return animatedOrders
      .filter(order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED')
      .map((order, index) => ({index, order}))
      .sort((a, b) => {
        const statusDiff = statusPriority[a.order.status] - statusPriority[b.order.status];
        if (statusDiff !== 0) {
          return statusDiff;
        }

        const createdAtDiff = toTimestamp(a.order.createdAt) - toTimestamp(b.order.createdAt);
        if (createdAtDiff !== 0) {
          return createdAtDiff;
        }

        return a.index - b.index;
      })
      .map(entry => entry.order);
  }, [animatedOrders]);

  const handleAdvanceStatus = useCallback(
    async (orderId: string, status: Order['status']) => {
      LayoutAnimation.configureNext(layoutReflowAnimation);
      await updateOrderStatus(orderId, status);
    },
    [updateOrderStatus],
  );

  const gridData = useMemo((): Array<Order | GridPlaceholder> => {
    const remainder = activeOrders.length % numColumns;
    if (remainder === 0) {
      return activeOrders;
    }

    return [
      ...activeOrders,
      ...Array.from({length: numColumns - remainder}, (_, index) => ({
        id: `grid-spacer-${activeOrders.map(order => order.id).join('-')}-${index}`,
        isPlaceholder: true as const,
      })),
    ];
  }, [activeOrders, numColumns]);

  const orderIdentity = useMemo(
    () => activeOrders.map(order => `${order.id}-${order.status}`).join('|'),
    [activeOrders],
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('kitchen activeOrders:', activeOrders.map(order => order.id));
    }
  }, [activeOrders]);

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel de cocina</Text>
        </View>
        <Pressable
          accessibilityLabel="Configuracion"
          onPress={() => navigation.navigate('Settings')}
          style={({pressed}) => [styles.settingsButton, {opacity: pressed ? 0.75 : 1}]}>
          <Text style={styles.settingsIcon}>{'\u2699'}</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {orderDateFilterOptions.map(option => {
          const selected = dateFilter === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setDateFilter(option.value)}
              style={({pressed}) => [
                styles.filterPill,
                selected && styles.filterPillSelected,
                {opacity: pressed ? 0.85 : 1},
              ]}>
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        data={gridData}
        extraData={orderIdentity}
        key="kitchen-grid-2"
        keyExtractor={item =>
          'isPlaceholder' in item ? item.id : `${item.id}-${item.status}`
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>La cocina esta al dia</Text>
            <Text style={styles.emptySubtitle}>Los nuevos pedidos apareceran automaticamente.</Text>
          </View>
        }
        numColumns={numColumns}
        renderItem={({item}) =>
          'isPlaceholder' in item ? (
            <View style={styles.placeholderCard} />
          ) : (
            <View style={styles.cardWrapper}>
              <OrderCard order={item} onAdvanceStatus={handleAdvanceStatus} />
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  filterPill: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: theme.colors.surface,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  list: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  cardWrapper: {
    flex: 1,
  },
  placeholderCard: {
    flex: 1,
  },
  row: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  settingsIcon: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 26,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
  },
});
