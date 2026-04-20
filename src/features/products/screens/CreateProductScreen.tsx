import React from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../../../shared/components';
import { theme } from '../../../shared/constants';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KitchenStackParamList } from '../../../navigation/types';
import { AuthInput } from '../../auth/components/AuthInput';
import { useCreateProduct } from '../hooks/useCreateProduct';

export function CreateProductScreen() {
  const {
    canSave,
    error,
    imageUri,
    isLoading,
    name,
    pickImage,
    price,
    removeImage,
    saveProduct,
    setName,
    setPrice,
  } = useCreateProduct();

  const navigation = useNavigation<NativeStackNavigationProp<KitchenStackParamList>>();

  const handleSaveProduct = async () => {
    const wasSaved = await saveProduct();
    Alert.alert('Producto guardado', 'El producto se ha guardado correctamente');
    if (wasSaved) {
      navigation.goBack();
    }
  };

  return (
    <Screen contentStyle={styles.container} scrollable>
      <View style={styles.card}>
        <Text style={styles.title}>Nuevo producto</Text>
        <Text style={styles.subtitle}>
          Crea un platillo para que el equipo lo pueda usar en la operacion diaria.
        </Text>

        <AuthInput
          autoCapitalize="words"
          label="Nombre del producto"
          onChangeText={setName}
          placeholder="Ej. Tacos al pastor"
          value={name}
        />

        <AuthInput
          keyboardType="decimal-pad"
          label="Precio"
          onChangeText={setPrice}
          placeholder="Ej. 85"
          value={price}
        />

        <View style={styles.imageSection}>
          <Text style={styles.label}>Imagen (opcional)</Text>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={styles.emptyPreview}>
              <Text style={styles.emptyPreviewText}>No hay imagen seleccionada</Text>
            </View>
          )}

          <View style={styles.imageActions}>
            <AppButton label="Seleccionar imagen" onPress={pickImage} variant="secondary" />
            {imageUri ? <AppButton label="Quitar" onPress={removeImage} variant="danger" /> : null}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton
          disabled={!canSave}
          label="Guardar producto"
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
  emptyPreview: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 160,
    justifyContent: 'center',
  },
  emptyPreviewText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
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
