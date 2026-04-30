import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../../../shared/components';
import { theme } from '../../../shared/constants';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KitchenStackParamList } from '../../../navigation/types';
import { AuthInput } from '../../auth/components/AuthInput';
import { useCreateProduct } from '../hooks/useCreateProduct';

export function CreateProductScreen() {
  const {
    addComplement,
    canSave,
    complements,
    error,
    imageUri,
    isLoading,
    name,
    pickImage,
    price,
    removeComplement,
    removeImage,
    saveProduct,
    setName,
    setPrice,
    updateComplement,
  } = useCreateProduct();

  const navigation =
    useNavigation<NativeStackNavigationProp<KitchenStackParamList>>();
  const canAddComplement = complements.length < 3;
  const handleSafeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('KitchenDashboard');
  };

  const handleSaveProduct = async () => {
    const wasSaved = await saveProduct();
    if (wasSaved) {
      Alert.alert(
        'Producto guardado',
        'El producto se ha guardado correctamente',
      );
      handleSafeGoBack();
    }
  };

  return (
    <Screen contentStyle={styles.container} scrollable>
      <View style={styles.card}>
        <Text style={styles.title}>Nuevo producto</Text>
        <Text style={styles.subtitle}>
          Crea un platillo para que el equipo lo pueda usar en la operacion
          diaria.
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
              <Text style={styles.emptyPreviewText}>
                No hay imagen seleccionada
              </Text>
            </View>
          )}

          <View style={styles.imageActions}>
            <AppButton
              label="Seleccionar imagen"
              onPress={pickImage}
              variant="secondary"
            />
            {imageUri ? (
              <AppButton
                label="Quitar"
                onPress={removeImage}
                variant="danger"
              />
            ) : null}
          </View>
        </View>

        <View style={styles.complementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Complementos (opcional)</Text>
            <Text style={styles.helperText}>
              Agrega hasta 3 complementos que el cliente puede elegir
            </Text>
          </View>

          <View style={styles.complementList}>
            {complements.map((complement, index) => (
              <View key={`complement-${index}`} style={styles.complementRow}>
                <View style={styles.complementInputWrapper}>
                  <AuthInput
                    autoCapitalize="words"
                    label={`Complemento ${index + 1}`}
                    onChangeText={value => updateComplement(index, value)}
                    placeholder="Ej. Cebolla"
                    value={complement}
                  />
                </View>
                <Pressable
                  accessibilityLabel={`Eliminar complemento ${index + 1}`}
                  onPress={() => removeComplement(index)}
                  style={({ pressed }) => [
                    styles.removeComplementButton,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Text style={styles.removeComplementText}>Eliminar</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <AppButton
            disabled={!canAddComplement}
            label="+ Agregar complemento"
            onPress={addComplement}
            variant="secondary"
          />
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
  complementInputWrapper: {
    flex: 1,
  },
  complementList: {
    gap: theme.spacing.sm,
  },
  complementRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  complementsSection: {
    gap: theme.spacing.sm,
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
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  removeComplementButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  removeComplementText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    gap: theme.spacing.xs,
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
