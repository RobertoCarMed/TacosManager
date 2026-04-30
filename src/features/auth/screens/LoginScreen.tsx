import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {StyleSheet, Text, View} from 'react-native';
import {AuthStackParamList} from '../../../navigation/types';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useResponsive} from '../../../shared/hooks';
import {AuthInput} from '../components/AuthInput';
import {useLogin} from '../hooks/useLogin';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {error, isLoading, login} = useLogin();
  const {isTablet} = useResponsive();

  const title = useMemo(
    () => (isTablet ? 'Opera tu taqueria en tiempo real' : 'TacosManager'),
    [isTablet],
  );

  const handleLogin = async () => {
    console.log("handleLogin", email, password);
    await login(email, password);
  };

  return (
    <Screen contentStyle={styles.screen} scrollable>
      <View style={[styles.card, isTablet && styles.cardTablet]}>
        <Text style={styles.eyebrow}>Acceso del personal</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Inicia sesion con tu cuenta para cargar tu perfil y permisos operativos.
        </Text>

        <AuthInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label="Correo"
          onChangeText={setEmail}
          placeholder="correo@taqueria.com"
          value={email}
        />

        <AuthInput
          label="Contrasena"
          onChangeText={setPassword}
          placeholder="Tu contrasena"
          secureTextEntry
          value={password}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton label="Entrar" loading={isLoading} onPress={handleLogin} />
        <AppButton
          label="Crear cuenta"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
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
  cardTablet: {
    alignSelf: 'center',
    maxWidth: 540,
    width: '100%',
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  screen: {
    justifyContent: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
});
