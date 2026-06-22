import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WaiterStackParamList} from '../../../navigation/types';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {printerStorage} from '../../../services/storage/printerStorage';

type Props = NativeStackScreenProps<WaiterStackParamList, 'PrinterConfig'>;

export function PrinterConfigScreen({navigation}: Props) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('9100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    printerStorage.getConfig().then(config => {
      if (config) {
        setHost(config.host);
        setPort(String(config.port));
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmedHost = host.trim();
    const portNumber = parseInt(port, 10);

    if (!trimmedHost) {
      Alert.alert('Campo requerido', 'Ingresa la dirección IP de la impresora.');
      return;
    }

    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      Alert.alert('Puerto inválido', 'El puerto debe ser un número entre 1 y 65535.');
      return;
    }

    setSaving(true);
    try {
      await printerStorage.saveConfig({host: trimmedHost, port: portNumber});
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <Text style={styles.subtitle}>
        Ingresa la IP y el puerto de la impresora POS en la red local.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Dirección IP</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
          onChangeText={setHost}
          placeholder="192.168.1.100"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.input}
          value={host}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Puerto</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setPort}
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.input}
          value={port}
        />
      </View>

      <AppButton
        disabled={saving}
        label={saving ? 'Guardando...' : 'Guardar'}
        onPress={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  field: {
    gap: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
