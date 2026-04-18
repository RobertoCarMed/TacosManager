import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {KitchenStackParamList} from '../../../navigation/types';
import {AppButton, OrderCard, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useAuth} from '../../auth';
import {useOrders} from '../../orders';

type Props = NativeStackScreenProps<KitchenStackParamList, 'KitchenDashboard'>;

export function KitchenScreen({navigation}: Props) {
  const {error, orders, updateOrderStatus} = useOrders();
  const {user} = useAuth();

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel de cocina</Text>
          <Text style={styles.subtitle}>Pedidos en vivo para {user?.taqueriaId}</Text>
        </View>
        <Pressable
          accessibilityLabel="Configuracion"
          onPress={() => navigation.navigate('Settings')}
          style={({pressed}) => [styles.settingsButton, {opacity: pressed ? 0.75 : 1}]}>
          <Text style={styles.settingsIcon}>{'\u2699'}</Text>
        </Pressable>
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
            footer={
              item.status === 'pending' ? (
                <AppButton
                  label="Marcar preparando"
                  onPress={() => updateOrderStatus(item.id, 'preparing')}
                />
              ) : item.status === 'preparing' ? (
                <AppButton
                  label="Marcar listo"
                  onPress={() => updateOrderStatus(item.id, 'ready')}
                />
              ) : (
                <AppButton
                  label="Entregado"
                  onPress={() => updateOrderStatus(item.id, 'completed')}
                  variant="secondary"
                />
              )
            }
            order={item}
          />
        )}
      />
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  list: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
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
    fontSize: 20,
    lineHeight: 22,
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
