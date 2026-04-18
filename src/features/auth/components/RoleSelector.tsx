import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {RegistrationRole} from '../types';

type RoleSelectorProps = {
  value: RegistrationRole | null;
  onChange: (role: RegistrationRole) => void;
  error?: string | null;
};

const roleLabels: Record<RegistrationRole, string> = {
  cook: 'Cocinero',
  waiter: 'Mesero',
};

export function RoleSelector({error, onChange, value}: RoleSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rol</Text>
      <View style={styles.row}>
        {(Object.keys(roleLabels) as RegistrationRole[]).map(role => (
          <AppButton
            key={role}
            label={roleLabels[role]}
            onPress={() => onChange(role)}
            style={styles.button}
            variant={value === role ? 'primary' : 'secondary'}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
  },
  container: {
    gap: theme.spacing.xs,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
