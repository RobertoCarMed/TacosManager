import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {WaiterStackParamList} from '../../../navigation/types';
import {AppButton, OrderCard, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useAuth} from '../../auth';
import {useOrders} from '../hooks/useOrders';

type Props = NativeStackScreenProps<WaiterStackParamList, 'WaiterOrders'>;

export function WaiterOrdersScreen({navigation}: Props) {
  const {error, orders} = useOrders();
  const {signOut, user} = useAuth();

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Turno de {user?.name}</Text>
          <Text style={styles.subtitle}>Pedidos activos para {user?.taqueriaId}</Text>
        </View>
        <AppButton label="Salir" onPress={signOut} variant="secondary" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={orders}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay pedidos por ahora</Text>
            <Text style={styles.emptySubtitle}>
              Los nuevos pedidos apareceran aqui automaticamente
            </Text>
          </View>
        }
        renderItem={({item}) => <OrderCard order={item} />}
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
