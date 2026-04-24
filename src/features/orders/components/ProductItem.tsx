import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components';
import { theme } from '../../../shared/constants';

function getSafePrice(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

type ProductItemProps = {
  availableComplements?: string[];
  complements?: string[];
  name: string;
  onRemove: () => void;
  price?: number;
  quantity: number;
};

export function ProductItem({
  name,
  onRemove,
  price,
  quantity,
}: ProductItemProps) {
  const unitPrice = getSafePrice(price);
  const subtotal = unitPrice * quantity;

  return (
    <View style={styles.container}>
      <View style={styles.itemRow}>
        <Text style={styles.itemLeftText}>
          {quantity}x {name}
        </Text>
        <Text style={styles.itemRightText}>
          {formatCurrency(unitPrice)} | {formatCurrency(subtotal)}
        </Text>
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
  itemLeftText: {
    color: theme.colors.textPrimary,
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 24,
    marginRight: theme.spacing.md,
  },
  itemRightText: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  itemRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: theme.spacing.sm,
  },
});
