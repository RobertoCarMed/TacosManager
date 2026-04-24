import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components';
import { theme } from '../../../shared/constants';
import { ProductItem } from './ProductItem';

type PlateItem = {
  availableComplements?: string[];
  complements?: string[];
  name: string;
  price?: number;
  quantity: number;
};

type PlateCardProps = {
  index: number;
  isActive: boolean;
  items: PlateItem[];
  onPress: () => void;
  onRemove: () => void;
  onRemoveItem: (itemIndex: number) => void;
  showRemove: boolean;
};

export function PlateCard({
  index,
  isActive,
  items,
  onPress,
  onRemove,
  onRemoveItem,
  showRemove,
}: PlateCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isActive && styles.cardActive,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.plateLabel}>Plato {index + 1}</Text>
          {isActive ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Editando</Text>
            </View>
          ) : null}
        </View>
        {showRemove ? (
          <AppButton
            label="Quitar plato"
            onPress={onRemove}
            style={styles.removeButton}
            variant="secondary"
          />
        ) : null}
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyHint}>
          {isActive
            ? 'Selecciona productos abajo para agregar a este plato.'
            : 'Toca para editar este plato.'}
        </Text>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item, itemIndex) => (
            <ProductItem
              availableComplements={item.availableComplements}
              complements={item.complements}
              key={`${item.name}-${itemIndex}`}
              name={item.name}
              onRemove={() => onRemoveItem(itemIndex)}
              price={item.price}
              quantity={item.quantity}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeBadge: {
    backgroundColor: `${theme.colors.primary}18`,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  cardActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  emptyHint: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemsList: {
    gap: theme.spacing.xs,
  },
  plateLabel: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  removeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
