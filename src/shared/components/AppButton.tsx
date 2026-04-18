import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import {theme} from '../constants';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function AppButton({
  disabled,
  label,
  loading,
  onPress,
  style,
  variant = 'primary',
}: AppButtonProps) {
  const backgroundColor =
    variant === 'secondary'
      ? theme.colors.muted
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.primary;

  const textColor =
    variant === 'secondary' ? theme.colors.textPrimary : theme.colors.surface;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        {backgroundColor, opacity: pressed || disabled ? 0.7 : 1},
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, {color: textColor}]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: theme.radius.md,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
