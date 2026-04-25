import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WaiterStackParamList } from '../../../navigation/types';
import { AppButton, OrderCard, Screen } from '../../../shared/components';
import { theme } from '../../../shared/constants';
import { useAuth } from '../../auth/context/AuthContext';
import { useProducts } from '../../products/hooks/useProducts';
import { Product } from '../../products/types';
import { PlateCard } from '../components/PlateCard';
import { useEditOrder } from '../hooks/useEditOrder';

const productPlaceholder = require('../../../assets/images/product-placeholder.jpg');

type Props = NativeStackScreenProps<WaiterStackParamList, 'EditOrder'>;

export function EditOrderScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [selectorVisible, setSelectorVisible] = useState(false);
  const { user } = useAuth();
  const {
    error: productsError,
    isLoading: isProductsLoading,
    products,
  } = useProducts(user?.taqueriaId);

  const {
    activePlateId,
    addPlate,
    addProduct,
    canSave,
    decrementQuantity,
    error,
    existingOrder,
    hasNewItems,
    incrementQuantity,
    isLoading,
    isLoadingOrder,
    loadError,
    plates,
    quantity,
    removePlate,
    removeProduct,
    saveChanges,
    selectProduct,
    selectedComplements,
    selectedProduct,
    setActivePlateId,
    toggleComplement,
  } = useEditOrder(orderId);

  const orderWithResolvedPrices = useMemo(() => {
    if (!existingOrder) {
      return null;
    }
    const productPriceById = new Map(
      products.map(product => [product.id, product.price]),
    );
    const productPriceByName = new Map(
      products.map(product => [product.name.trim().toLowerCase(), product.price]),
    );

    const nextPlates = existingOrder.plates.map(plate => ({
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
        return { ...item, price: resolvedPrice };
      }),
    }));

    return {
      ...existingOrder,
      items: nextPlates.flatMap(plate => plate.items),
      plates: nextPlates,
    };
  }, [existingOrder, products]);

  const canAddProduct = useMemo(
    () => Boolean(selectedProduct) && quantity > 0,
    [quantity, selectedProduct],
  );

  const handleSave = async () => {
    const ok = await saveChanges();
    if (ok) {
      Alert.alert('Listo', 'Pedido actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleSelectProduct = (product: Product) => {
    selectProduct(product);
    setSelectorVisible(false);
  };

  const selectedImageSource = selectedProduct?.imageUrl
    ? { uri: selectedProduct.imageUrl }
    : productPlaceholder;

  if (isLoadingOrder) {
    return (
      <Screen contentStyle={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Cargando pedido...</Text>
      </Screen>
    );
  }

  if (loadError || !orderWithResolvedPrices) {
    return (
      <Screen contentStyle={styles.centered}>
        <Text style={styles.error}>
          {loadError ?? 'No se pudo cargar el pedido.'}
        </Text>
        <AppButton
          label="Volver"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingBlock}>
          <Text style={styles.headingKicker}>Vista previa (no editable)</Text>
        </View>

        <OrderCard order={orderWithResolvedPrices} readOnly />

        <Text style={styles.sectionTitle}>Nuevos productos</Text>
        <Text style={styles.hintText}>
          Los platos e items actuales no se pueden quitar. Agrega platos
          y productos nuevos abajo.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleInline}>Platos nuevos</Text>
            <AppButton
              label="+ Agregar plato"
              onPress={addPlate}
              style={styles.addPlateButton}
              variant="secondary"
            />
          </View>

          {plates.map((plate, plateIndex) => (
            <PlateCard
              key={plate.id}
              index={plateIndex}
              isActive={plate.id === activePlateId}
              items={plate.items}
              onPress={() => setActivePlateId(plate.id)}
              onRemove={() => removePlate(plate.id)}
              onRemoveItem={itemIndex => removeProduct(plate.id, itemIndex)}
              showRemove={plates.length > 1}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Agregar producto al plato{' '}
            {plates.findIndex(p => p.id === activePlateId) + 1}
          </Text>

          <Text style={styles.fieldLabel}>Producto</Text>
          <Pressable
            onPress={() => setSelectorVisible(true)}
            style={({ pressed }) => [
              styles.selector,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={[
                styles.selectorText,
                !selectedProduct ? styles.selectorPlaceholder : null,
              ]}
            >
              {selectedProduct
                ? selectedProduct.name
                : 'Selecciona un producto'}
            </Text>
          </Pressable>

          {selectedProduct?.complements?.length ? (
            <View style={styles.complementsSection}>
              <Text style={styles.fieldLabel}>Complementos</Text>
              <View style={styles.complementsList}>
                {selectedProduct.complements.map(complement => {
                  const isSelected = selectedComplements.includes(complement);
                  return (
                    <Pressable
                      key={complement}
                      onPress={() => toggleComplement(complement)}
                      style={({ pressed }) => [
                        styles.complementColumnItem,
                        styles.complementOption,
                        isSelected ? styles.complementOptionSelected : null,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected ? styles.checkboxSelected : null,
                        ]}
                      >
                        {isSelected ? (
                          <Text style={styles.checkboxIcon}>✓</Text>
                        ) : null}
                      </View>
                      <Text style={styles.complementText}>{complement}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.productControlRow}>
            <Image source={selectedImageSource} style={styles.productImage} />
            <View style={styles.quantityControl}>
              <AppButton
                label="-"
                onPress={decrementQuantity}
                style={styles.quantityButton}
                variant="secondary"
              />
              <Text style={styles.quantityValue}>{quantity}</Text>
              <AppButton
                label="+"
                onPress={incrementQuantity}
                style={styles.quantityButton}
              />
            </View>
          </View>

          {productsError ? (
            <Text style={styles.error}>{productsError}</Text>
          ) : null}

          <AppButton
            disabled={!canAddProduct}
            label="Agregar producto"
            onPress={addProduct}
            variant="secondary"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton
          disabled={!canSave || isLoading}
          label="Guardar cambios"
          loading={isLoading}
          onPress={handleSave}
        />
        {!hasNewItems ? (
          <Text style={styles.disabledHint}>
            Agrega productos nuevos para activar el boton.
          </Text>
        ) : null}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setSelectorVisible(false)}
        transparent
        visible={selectorVisible}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            onPress={() => setSelectorVisible(false)}
            style={styles.modalBackdrop}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona un producto</Text>
            {isProductsLoading ? (
              <Text style={styles.modalStateText}>Cargando productos...</Text>
            ) : products.length === 0 ? (
              <Text style={styles.modalStateText}>
                No hay productos disponibles.
              </Text>
            ) : (
              <FlatList
                data={products}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectProduct(item)}
                    style={({ pressed }) => [
                      styles.productOption,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text style={styles.productOptionName}>{item.name}</Text>
                    <Text style={styles.productOptionPrice}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addPlateButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxIcon: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  complementOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  complementOptionSelected: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  complementText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  complementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  complementsSection: {
    gap: theme.spacing.sm,
  },
  complementColumnItem: {
    width: '48%',
  },
  container: {
    flex: 1,
  },
  disabledHint: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  headingBlock: {
    marginBottom: theme.spacing.xs,
  },
  headingKicker: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  hintText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: theme.spacing.md,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    maxHeight: '60%',
    padding: theme.spacing.md,
    width: '90%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: '#00000055',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalStateText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    paddingVertical: theme.spacing.md,
    textAlign: 'center',
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  productControlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productImage: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 72,
    width: 72,
  },
  productOption: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  productOptionName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  productOptionPrice: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  quantityButton: {
    minWidth: 50,
  },
  quantityControl: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quantityValue: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  scrollContent: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitleInline: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  selector: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  selectorPlaceholder: {
    color: theme.colors.textSecondary,
  },
  selectorText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
});
