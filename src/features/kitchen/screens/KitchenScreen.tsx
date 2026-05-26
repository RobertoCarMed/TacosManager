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

const ORDERS_PER_PAGE = 2;

const statusPriority: Record<Order['status'], number> = {
  PREPARING: 1,
  PENDING: 2,
  READY: 3,
  DELIVERED: 4,
  CANCELLED: 5,
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
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>('active');
  const {error, orders, updateOrderStatus} = useOrders({dateFilter});
  const [animatedOrders, setAnimatedOrders] = useState(orders);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
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

  const pages = useMemo((): Order[][] => {
    const result: Order[][] = [];
    for (let i = 0; i < activeOrders.length; i += ORDERS_PER_PAGE) {
      result.push(activeOrders.slice(i, i + ORDERS_PER_PAGE));
    }
    return result;
  }, [activeOrders]);

  const handleAdvanceStatus = useCallback(
    async (orderId: string, status: Order['status']) => {
      LayoutAnimation.configureNext(layoutReflowAnimation);
      await updateOrderStatus(orderId, status);
    },
    [updateOrderStatus],
  );

  const pageIdentity = useMemo(
    () => activeOrders.map(order => `${order.id}-${order.status}`).join('|'),
    [activeOrders],
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('kitchen activeOrders:', activeOrders.map(order => order.id));
    }
  }, [activeOrders]);

  // Reset to first page when orders change significantly
  useEffect(() => {
    if (currentPage >= pages.length && pages.length > 0) {
      setCurrentPage(pages.length - 1);
    }
  }, [pages.length, currentPage]);

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Text style={styles.title}>Panel de cocina</Text>
          <View style={styles.headerRight}>
            {pages.length > 1 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {activeOrders.length} pedidos
                </Text>
              </View>
            )}
            <Pressable
              accessibilityLabel="Configuracion"
              onPress={() => navigation.navigate('Settings')}
              style={({pressed}) => [styles.settingsButton, {opacity: pressed ? 0.75 : 1}]}>
              <Text style={styles.settingsIcon}>{'⚙'}</Text>
            </Pressable>
          </View>
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
      </View>

      {activeOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>La cocina esta al dia</Text>
          <Text style={styles.emptySubtitle}>Los nuevos pedidos apareceran automaticamente.</Text>
        </View>
      ) : (
        <>
          <FlatList
            contentContainerStyle={styles.pageListContent}
            data={pages}
            extraData={pageIdentity}
            horizontal
            key="kitchen-pages"
            keyExtractor={(_, index) => `page-${index}`}
            onLayout={e => setPageWidth(e.nativeEvent.layout.width)}
            onMomentumScrollEnd={e => {
              if (pageWidth > 0) {
                const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
                setCurrentPage(Math.min(page, pages.length - 1));
              }
            }}
            pagingEnabled
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            style={styles.pageList}
            renderItem={({item: pageOrders}) =>
              pageWidth > 0 ? (
                <View style={[styles.page, {width: pageWidth}]}>
                  {pageOrders.map(order => (
                    <View key={order.id} style={styles.cardSlot}>
                      <OrderCard order={order} onAdvanceStatus={handleAdvanceStatus} />
                    </View>
                  ))}
                  {pageOrders.length < ORDERS_PER_PAGE && (
                    <View style={styles.cardSlot} />
                  )}
                </View>
              ) : null
            }
          />

          {pages.length > 1 && (
            <View style={styles.bottomSection}>
              <View style={styles.pageIndicator}>
                {pages.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, index === currentPage && styles.dotActive]}
                  />
                ))}
                <Text style={styles.pageLabel}>
                  {currentPage + 1} / {pages.length}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bottomSection: {
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  cardSlot: {
    flex: 1,
  },
  dot: {
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    width: 20,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
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
  headerBadge: {
    backgroundColor: theme.colors.muted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  headerBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  page: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  pageIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  pageLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  pageList: {
    flex: 1,
  },
  pageListContent: {
    alignItems: 'stretch',
  },
  screenContent: {
    gap: 0,
    padding: 0,
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  topSection: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
});
