import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../../../shared/components';
import {theme} from '../../../shared/constants';

type ProductItemProps = {
  name: string;
  quantity: number;
  onRemove: () => void;
};

export function ProductItem({name, onRemove, quantity}: ProductItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.quantity}>Cantidad: {quantity}</Text>
      </View>
      <AppButton label="Quitar" onPress={onRemove} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
    marginRight: theme.spacing.sm,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  quantity: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});
