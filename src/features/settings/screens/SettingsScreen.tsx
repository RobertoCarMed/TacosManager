import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {StyleSheet, Text, View} from 'react-native';
import {KitchenStackParamList} from '../../../navigation/types';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useAuth} from '../../auth';

type Props = NativeStackScreenProps<KitchenStackParamList, 'Settings'>;

export function SettingsScreen({navigation}: Props) {
  const {error, isLoading, signOut} = useAuth();

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Configuracion</Text>
        <Text style={styles.subtitle}>
          Administra acciones del equipo de cocina desde un solo lugar.
        </Text>

        <AppButton
          label="Agregar producto"
          onPress={() => navigation.navigate('CreateProduct')}
          style={styles.actionButton}
        />
        <AppButton
          label="Editar producto"
          onPress={() => navigation.navigate('EditProduct')}
          style={styles.actionButton}
          variant="secondary"
        />
      </View>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          label="Cerrar sesion"
          loading={isLoading}
          onPress={signOut}
          variant="danger"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: theme.spacing.md,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    marginTop: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
});
