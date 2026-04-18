import React, {useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {AuthInput} from '../../auth/components/AuthInput';
import {useEditProduct} from '../hooks/useEditProduct';
import {Product} from '../types';

export function EditProductScreen() {
  const {
    canSave,
    error,
    isLoading,
    isLoadingProducts,
    name,
    newImageUri,
    pickImage,
    price,
    products,
    saveProduct,
    selectedProduct,
    selectedProductId,
    setName,
    setPrice,
    setSelectedProductId,
  } = useEditProduct();

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleSaveProduct = async () => {
    const wasSaved = await saveProduct();

    if (wasSaved) {
      Alert.alert(
        'Producto actualizado',
        'Los cambios se guardaron correctamente.',
      );
    }
  };

  const imageSource = newImageUri
    ? {uri: newImageUri}
    : selectedProduct?.imageUrl
    ? {uri: selectedProduct.imageUrl}
    : require('../../../assets/images/product-placeholder.jpg');

  const renderProductItem = (item: Product) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => {
        setSelectedProductId(item.id);
        setIsPickerOpen(false);
      }}
      style={styles.pickerItem}>
      <Text style={styles.pickerItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Screen contentStyle={styles.container} scrollable>
      <View style={styles.card}>
        <Text style={styles.title}>Editar producto</Text>
        <Text style={styles.subtitle}>
          Modifica los detalles de un producto existente.
        </Text>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Selecciona un producto</Text>
          <TouchableOpacity
            onPress={() => setIsPickerOpen(!isPickerOpen)}
            style={styles.pickerButton}>
            <Text
              style={
                selectedProductId
                  ? styles.pickerButtonText
                  : styles.pickerButtonPlaceholder
              }>
              {selectedProduct
                ? selectedProduct.name
                : 'Toca para seleccionar...'}
            </Text>
          </TouchableOpacity>

          {isPickerOpen && (
            <View style={styles.pickerDropdown}>
              {isLoadingProducts ? (
                <Text style={styles.pickerLoading}>Cargando productos...</Text>
              ) : products.length > 0 ? (
                <ScrollView nestedScrollEnabled style={styles.pickerScroll}>
                  {products.map(renderProductItem)}
                </ScrollView>
              ) : (
                <Text style={styles.pickerLoading}>
                  No hay productos registrados.
                </Text>
              )}
            </View>
          )}
        </View>

        <AuthInput
          autoCapitalize="words"
          editable={!!selectedProductId}
          label="Nombre del producto"
          onChangeText={setName}
          placeholder="Ej. Tacos al pastor"
          value={name}
        />

        <AuthInput
          editable={!!selectedProductId}
          keyboardType="decimal-pad"
          label="Precio"
          onChangeText={setPrice}
          placeholder="Ej. 85"
          value={price}
        />

        <View style={styles.imageSection}>
          <Text style={styles.label}>Imagen</Text>

          <Image source={imageSource} style={styles.preview} />

          <View style={styles.imageActions}>
            <AppButton
              disabled={!selectedProductId}
              label="Cambiar imagen"
              onPress={pickImage}
              variant="secondary"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton
          disabled={!canSave}
          label="Guardar cambios"
          loading={isLoading}
          onPress={handleSaveProduct}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  container: {
    justifyContent: 'center',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  imageActions: {
    gap: theme.spacing.sm,
  },
  imageSection: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pickerButton: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  pickerButtonPlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  pickerButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  pickerContainer: {
    gap: theme.spacing.xs,
    zIndex: 1, // To allow dropdown to show over other elements implicitly if changed to absolute later
  },
  pickerDropdown: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    maxHeight: 150,
    marginTop: theme.spacing.xs,
  },
  pickerItem: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.sm,
  },
  pickerItemText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  pickerLoading: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    padding: theme.spacing.md,
    textAlign: 'center',
  },
  pickerScroll: {
    width: '100%',
  },
  preview: {
    borderRadius: theme.radius.md,
    height: 160,
    width: '100%',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
});
