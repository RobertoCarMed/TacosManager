import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {WaiterStackParamList} from '../../../navigation/types';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {AuthInput} from '../../auth/components/AuthInput';
import {useAuth} from '../../auth/context/AuthContext';
import {useProducts} from '../../products/hooks/useProducts';
import {Product} from '../../products/types';
import {ProductItem} from '../components/ProductItem';
import {useCreateOrder} from '../hooks/useCreateOrder';

const productPlaceholder = require('../../../assets/images/product-placeholder.jpg');

type Props = NativeStackScreenProps<WaiterStackParamList, 'CreateOrder'>;

export function CreateOrderScreen({navigation}: Props) {
  const [selectorVisible, setSelectorVisible] = useState(false);
  const {user} = useAuth();
  const {error: productsError, isLoading: isProductsLoading, products} = useProducts(
    user?.taqueriaId,
  );
  const {
    addProduct,
    canSave,
    decrementQuantity,
    error,
    incrementQuantity,
    isLoading,
    items,
    quantity,
    removeProduct,
    saveOrder,
    selectProduct,
    selectedProduct,
    setTable,
    table,
  } = useCreateOrder();

  const canAddProduct = useMemo(
    () => Boolean(selectedProduct) && quantity > 0,
    [quantity, selectedProduct],
  );

  const handleSave = async () => {
    const wasSaved = await saveOrder();

    if (wasSaved) {
      Alert.alert('Pedido guardado', 'El pedido se envio correctamente a cocina.');
      navigation.goBack();
    }
  };

  const handleSelectProduct = (product: Product) => {
    selectProduct(product);
    setSelectorVisible(false);
  };

  const selectedImageSource = selectedProduct?.imageUrl
    ? {uri: selectedProduct.imageUrl}
    : productPlaceholder;

  return (
    <Screen contentStyle={styles.container}>
      <Text style={styles.sectionTitle}>Mesa o cliente</Text>
      <AuthInput
        autoCapitalize="words"
        keyboardType="default"
        label="Mesa o cliente"
        onChangeText={setTable}
        placeholder="Ej. Mesa 12 o Cliente Juan"
        value={table}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agregar producto</Text>

        <Text style={styles.fieldLabel}>Producto</Text>
        <Pressable
          onPress={() => setSelectorVisible(true)}
          style={({pressed}) => [
            styles.selector,
            {opacity: pressed ? 0.85 : 1},
          ]}>
          <Text
            style={[
              styles.selectorText,
              !selectedProduct ? styles.selectorPlaceholder : null,
            ]}>
            {selectedProduct ? selectedProduct.name : 'Selecciona un producto'}
          </Text>
        </Pressable>

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
            <AppButton label="+" onPress={incrementQuantity} style={styles.quantityButton} />
          </View>
        </View>

        {productsError ? <Text style={styles.error}>{productsError}</Text> : null}

        <AppButton
          disabled={!canAddProduct}
          label="Agregar producto"
          onPress={addProduct}
          variant="secondary"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productos agregados</Text>
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sin productos por ahora</Text>
              <Text style={styles.emptySubtitle}>
                Agrega productos para construir el pedido.
              </Text>
            </View>
          }
          renderItem={({index, item}) => (
            <ProductItem
              name={item.name}
              onRemove={() => removeProduct(index)}
              quantity={item.quantity}
            />
          )}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        disabled={!canSave}
        label="Guardar pedido"
        loading={isLoading}
        onPress={handleSave}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setSelectorVisible(false)}
        transparent
        visible={selectorVisible}>
        <View style={styles.modalOverlay}>
          <Pressable onPress={() => setSelectorVisible(false)} style={styles.modalBackdrop} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona un producto</Text>
            {isProductsLoading ? (
              <Text style={styles.modalStateText}>Cargando productos...</Text>
            ) : products.length === 0 ? (
              <Text style={styles.modalStateText}>No hay productos disponibles.</Text>
            ) : (
              <FlatList
                data={products}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <Pressable
                    onPress={() => handleSelectProduct(item)}
                    style={({pressed}) => [
                      styles.productOption,
                      {opacity: pressed ? 0.8 : 1},
                    ]}>
                    <Text style={styles.productOptionName}>{item.name}</Text>
                    <Text style={styles.productOptionPrice}>${item.price.toFixed(2)}</Text>
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
  container: {
    gap: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
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
  list: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
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
  section: {
    gap: theme.spacing.sm,
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
});
