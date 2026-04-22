import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {KitchenStackParamList} from '../../../navigation/types';
import {AppButton, OrderCard, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useAuth} from '../../auth';
import {useOrders} from '../../orders';

type Props = NativeStackScreenProps<KitchenStackParamList, 'KitchenDashboard'>;

export function KitchenDashboardScreen({navigation}: Props) {
  const {error, orders, updateOrderStatus} = useOrders();
  const {signOut, user} = useAuth();

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel de cocina</Text>
          <Text style={styles.subtitle}>Pedidos en vivo para {user?.taqueriaId}</Text>
        </View>
        <AppButton label="Salir" onPress={signOut} size="large" variant="secondary" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={orders.filter(order => order.status !== 'completed')}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>La cocina esta al dia</Text>
            <Text style={styles.emptySubtitle}>Los nuevos pedidos apareceran automaticamente.</Text>
          </View>
        }
        renderItem={({item}) => (
          <OrderCard
            variant="kitchen"
            footer={
              item.status === 'pending' ? (
                <AppButton
                  label="Marcar preparando"
                  onPress={() => updateOrderStatus(item.id, 'preparing')}
                  size="large"
                />
              ) : item.status === 'preparing' ? (
                <AppButton
                  label="Marcar listo"
                  onPress={() => updateOrderStatus(item.id, 'ready')}
                  size="large"
                />
              ) : (
                <AppButton
                  label="Entregado"
                  onPress={() => updateOrderStatus(item.id, 'completed')}
                  size="large"
                  variant="secondary"
                />
              )
            }
            order={item}
          />
        )}
      />

      <Pressable
        accessibilityLabel="Crear producto"
        onPress={() => navigation.navigate('CreateProduct')}
        style={({pressed}) => [styles.fab, {opacity: pressed ? 0.85 : 1}]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
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
    gap: theme.spacing.lg,
    paddingBottom: 140,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 6,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
  },
});
