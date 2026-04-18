import React, {useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Alert, StyleSheet, Text, TextInput, View} from 'react-native';
import {WaiterStackParamList} from '../../../navigation/types';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useOrders} from '../../orders';

type Props = NativeStackScreenProps<WaiterStackParamList, 'CreateOrder'>;

function parseItems(rawItems: string) {
  return rawItems
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map((itemName, index) => ({
      id: `${itemName}-${index}`,
      name: itemName,
      quantity: 1,
    }));
}

export function CreateOrderScreen({navigation}: Props) {
  const [table, setTable] = useState('');
  const [itemsInput, setItemsInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const {createOrder, isLoading} = useOrders();

  const handleCreateOrder = async () => {
    const items = parseItems(itemsInput);

    if (!table.trim() || items.length === 0) {
      setLocalError('Captura mesa y al menos un taco separado por comas.');
      return;
    }

    try {
      setLocalError(null);
      await createOrder({
        items,
        table: table.trim(),
      });
      Alert.alert('Pedido creado', 'La cocina verá el pedido en tiempo real.');
      navigation.goBack();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'No se pudo crear el pedido.');
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <Text style={styles.label}>Mesa</Text>
      <TextInput
        onChangeText={setTable}
        placeholder="Ej. 12"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={table}
      />

      <Text style={styles.label}>Items</Text>
      <TextInput
        multiline
        onChangeText={setItemsInput}
        placeholder="Ej. Taco pastor, Agua fresca, Quesadilla"
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, styles.multilineInput]}
        value={itemsInput}
      />

      <View style={styles.helper}>
        <Text style={styles.helperText}>Cada item se separa con coma y se crea con cantidad 1.</Text>
      </View>

      {localError ? <Text style={styles.error}>{localError}</Text> : null}

      <AppButton label="Guardar pedido" loading={isLoading} onPress={handleCreateOrder} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  error: {
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
  helper: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
