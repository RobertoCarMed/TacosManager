import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WaiterStackParamList } from '../../../navigation/types';
import { AppButton, Screen } from '../../../shared/components';
import { theme } from '../../../shared/constants';
import { OrderType } from '../../../shared/types';
import { useAuth } from '../../auth/context/AuthContext';
import { useProducts } from '../../products/hooks/useProducts';
import { Product } from '../../products/types';
import { PlateCard } from '../components/PlateCard';
import { useCreateOrder } from '../hooks/useCreateOrder';

const productPlaceholder = require('../../../assets/images/product-placeholder.jpg');

type Props = NativeStackScreenProps<WaiterStackParamList, 'CreateOrder'>;

const ORDER_TYPES: { value: OrderType; emoji: string; label: string }[] = [
  { value: 'DINE_IN', emoji: '🍽', label: 'Comer aquí' },
  { value: 'TAKEAWAY', emoji: '🥡', label: 'Para llevar' },
  { value: 'DELIVERY', emoji: '🛵', label: 'Delivery' },
];

const FIELD_CONFIG: Record<OrderType, { label: string; placeholder: string }> = {
  DINE_IN: { label: 'Referencia', placeholder: 'Mesa 4' },
  TAKEAWAY: { label: 'Nombre de quien recogerá', placeholder: 'Roberto' },
  DELIVERY: { label: 'Dirección', placeholder: 'Av. Juárez #123' },
};

export function CreateOrderScreen({ navigation }: Props) {
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
    changeOrderType,
    decrementQuantity,
    deliveryAddress,
    error,
    incrementQuantity,
    isLoading,
    orderType,
    plates,
    quantity,
    reference,
    removePlate,
    removeProduct,
    saveOrder,
    selectProduct,
    selectedComplements,
    selectedProduct,
    setActivePlateId,
    setDeliveryAddress,
    setReference,
    toggleComplement,
  } = useCreateOrder();

  const canAddProduct = useMemo(
    () => Boolean(selectedProduct) && quantity > 0,
    [quantity, selectedProduct],
  );

  const handleSafeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('WaiterOrders');
  };

  const handleSave = async () => {
    const wasSaved = await saveOrder();
    if (wasSaved) {
      Alert.alert('Pedido guardado', 'El pedido se envio correctamente a cocina.');
      handleSafeGoBack();
    }
  };

  const handleSelectProduct = (product: Product) => {
    selectProduct(product);
    setSelectorVisible(false);
  };

  const selectedImageSource = selectedProduct?.imageUrl
    ? { uri: selectedProduct.imageUrl }
    : productPlaceholder;

  const fieldConfig = FIELD_CONFIG[orderType];

  return (
    <Screen contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Order type selector ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de pedido</Text>
          <View style={styles.typeSelector}>
            {ORDER_TYPES.map(t => (
              <Pressable
                key={t.value}
                onPress={() => changeOrderType(t.value)}
                style={({ pressed }) => [
                  styles.typeOption,
                  orderType === t.value && styles.typeOptionSelected,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    orderType === t.value && styles.typeLabelSelected,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Reference / address fields ───────────────────────────── */}
        <View style={styles.section}>
          {orderType !== 'DELIVERY' ? (
            <>
              <Text style={styles.fieldLabel}>
                {fieldConfig.label}
                <Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                autoCapitalize="words"
                keyboardType="default"
                onChangeText={setReference}
                placeholder={fieldConfig.placeholder}
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.input}
                value={reference}
              />
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>
                Dirección
                <Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                autoCapitalize="sentences"
                keyboardType="default"
                onChangeText={setDeliveryAddress}
                placeholder="Av. Juárez #123"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.input}
                value={deliveryAddress}
              />
              <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
                Nombre de referencia
                <Text style={styles.optional}> (opcional)</Text>
              </Text>
              <TextInput
                autoCapitalize="words"
                keyboardType="default"
                onChangeText={setReference}
                placeholder="Roberto"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.input}
                value={reference}
              />
            </>
          )}
        </View>

        {/* ── Plates list ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Platos</Text>
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

        {/* ── Add product to active plate ──────────────────────────── */}
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
              {selectedProduct ? selectedProduct.name : 'Selecciona un producto'}
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

        {/* ── Error / Save ─────────────────────────────────────────── */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton
          disabled={!canSave}
          label="Guardar pedido"
          loading={isLoading}
          onPress={handleSave}
        />
      </ScrollView>

      {/* ── Product selector modal ───────────────────────────────── */}
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
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldLabelSpaced: {
    marginTop: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
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
  optional: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
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
  required: {
    color: theme.colors.danger,
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
  selector: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  selectorPlaceholder: {
    color: theme.colors.textSecondary,
  },
  selectorText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: theme.colors.primary,
  },
  typeOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  typeOptionSelected: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
