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
  size?: 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function AppButton({
  disabled,
  label,
  loading,
  onPress,
  size = 'medium',
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

  const isLarge = size === 'large';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        isLarge ? styles.baseLarge : null,
        {backgroundColor, opacity: pressed || disabled ? 0.7 : 1},
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, isLarge ? styles.labelLarge : null, {color: textColor}]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  baseLarge: {
    minHeight: 64,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  labelLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
});
