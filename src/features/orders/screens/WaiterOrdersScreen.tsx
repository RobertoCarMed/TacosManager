import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {WaiterStackParamList} from '../../../navigation/types';
import {AppButton, OrderCard, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useAuth} from '../../auth';
import {useOrders} from '../hooks/useOrders';
import {useProducts} from '../../products/hooks/useProducts';
import {OrderDateFilter} from '../services/ordersService';
import {orderDateFilterOptions} from '../constants/dateFilters';
import {Order} from '../../../shared/types';
import {printerStorage} from '../../../services/storage/printerStorage';
import {sendRawBytes} from '../../../services/printing/tcpPrinterService';
import {buildTicket, hasCompleteUnitPrices} from '../../../services/printing/escposRenderer';

type Props = NativeStackScreenProps<WaiterStackParamList, 'WaiterOrders'>;

export function WaiterOrdersScreen({navigation}: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const {signOut, user, taqueria} = useAuth();
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>('active');
  const {error, orders} = useOrders({
    createdBy: user?.id,
    dateFilter,
  });
  const {products} = useProducts(user?.taqueriaId);

  const ordersWithResolvedPrices = useMemo(() => {
    const productPriceById = new Map(products.map(product => [product.id, product.price]));
    const productPriceByName = new Map(
      products.map(product => [product.name.trim().toLowerCase(), product.price]),
    );

    return orders.map(order => {
      const nextPlates = order.plates.map(plate => ({
        ...plate,
        items: plate.items.map(item => {
          const persistedPrice =
            typeof item.price === 'number' && Number.isFinite(item.price)
              ? item.price
              : 0;

          const resolvedPrice =
            persistedPrice > 0
              ? persistedPrice
              : (item.id ? productPriceById.get(item.id) : undefined) ??
                productPriceByName.get(item.name.trim().toLowerCase()) ??
                0;

          return {
            ...item,
            price: resolvedPrice,
          };
        }),
      }));

      return {
        ...order,
        items: nextPlates.flatMap(plate => plate.items),
        plates: nextPlates,
      };
    });
  }, [orders, products]);

  const handlePrint = async (order: Order) => {
    if (!taqueria) return;

    const config = await printerStorage.getConfig();
    if (!config) {
      navigation.navigate('PrinterConfig');
      return;
    }

    if (!hasCompleteUnitPrices(order)) {
      Alert.alert(
        'Sin precios',
        'Este pedido tiene items sin precio registrado y no se puede imprimir la cuenta.',
      );
      return;
    }

    setPrintingOrderId(order.id);
    try {
      const ticket = buildTicket(order, taqueria);
      await sendRawBytes(config.host, config.port, ticket);
    } catch (err) {
      Alert.alert(
        'Error de impresión',
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con la impresora.',
        [
          {text: 'Cancelar', style: 'cancel'},
          {text: 'Reintentar', onPress: () => handlePrint(order)},
        ],
      );
    } finally {
      setPrintingOrderId(null);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Turno de {user?.name}</Text>
        </View>
        <AppButton label="Salir" onPress={signOut} variant="secondary" />
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
        contentContainerStyle={styles.list}
        data={ordersWithResolvedPrices}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay pedidos por ahora</Text>
            <Text style={styles.emptySubtitle}>
              Los nuevos pedidos apareceran aqui automaticamente
            </Text>
          </View>
        }
        renderItem={({item}) => {
          const isSelected = selectedOrderId === item.id;
          const canPrint =
            item.status === 'READY' || item.status === 'DELIVERED';
          const isPrinting = printingOrderId === item.id;

          return (
            <OrderCard
              footer={
                isSelected && canPrint ? (
                  <AppButton
                    disabled={isPrinting}
                    label={isPrinting ? 'Imprimiendo...' : 'Imprimir ticket'}
                    loading={isPrinting}
                    onPress={() => handlePrint(item)}
                  />
                ) : undefined
              }
              onEditPress={() =>
                navigation.navigate('EditOrder', {orderId: item.id})
              }
              onPress={() =>
                setSelectedOrderId(current =>
                  current === item.id ? null : item.id,
                )
              }
              order={item}
              selected={isSelected}
            />
          );
        }}
      />

      <Pressable
        accessibilityLabel="Crear pedido"
        onPress={() => navigation.navigate('CreateOrder')}
        style={({pressed}) => [styles.fab, {opacity: pressed ? 0.85 : 1}]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  error: {
    color: theme.colors.danger,
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
  fab: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    bottom: theme.spacing.lg,
    elevation: 4,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing.lg,
    width: 60,
  },
  fabText: {
    color: theme.colors.surface,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 32,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  list: {
    gap: theme.spacing.md,
    paddingBottom: 100,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
});
