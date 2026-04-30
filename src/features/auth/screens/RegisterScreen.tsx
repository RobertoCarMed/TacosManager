import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {StyleSheet, Text, View} from 'react-native';
import {AuthStackParamList} from '../../../navigation/types';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useResponsive} from '../../../shared/hooks';
import {AuthInput} from '../components/AuthInput';
import {RoleSelector} from '../components/RoleSelector';
import {useRegister} from '../hooks/useRegister';
import {RegisterFormValues} from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;
type RegisterStage = 'form' | 'existing-taqueria' | 'create-taqueria';

const initialValues: RegisterFormValues = {
  address: '',
  city: '',
  confirmPassword: '',
  email: '',
  name: '',
  password: '',
  role: null,
  state: '',
  taqueriaName: '',
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getBaseFieldErrors(values: RegisterFormValues): FieldErrors {
  return {
    confirmPassword:
      !values.confirmPassword || values.password === values.confirmPassword
        ? undefined
        : 'Las contrasenas no coinciden.',
    email:
      !values.email.trim()
        ? 'Captura un correo.'
        : isValidEmail(values.email)
          ? undefined
          : 'Correo invalido.',
    name: values.name.trim() ? undefined : 'Captura el nombre.',
    password:
      !values.password
        ? 'Captura una contrasena.'
        : values.password.length >= 6
          ? undefined
          : 'Minimo 6 caracteres.',
    role: values.role ? undefined : 'Selecciona un rol.',
    taqueriaName: values.taqueriaName.trim()
      ? undefined
      : 'Captura el nombre de la taqueria.',
  };
}

function getTaqueriaFieldErrors(values: RegisterFormValues): FieldErrors {
  return {
    address: values.address.trim() ? undefined : 'Captura la direccion.',
    city: values.city.trim() ? undefined : 'Captura la ciudad.',
    state: values.state.trim() ? undefined : 'Captura el estado.',
  };
}

export function RegisterScreen({navigation}: Props) {
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [stage, setStage] = useState<RegisterStage>('form');
  const {
    error,
    inspectTaqueria,
    isLoading,
    register,
    resetTaqueriaLookup,
    taqueriaLookup,
  } = useRegister();
  const {isTablet} = useResponsive();

  const title = useMemo(
    () => (isTablet ? 'Registra a tu equipo y enlazalo a una taqueria' : 'Registro'),
    [isTablet],
  );

  const handleSafeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleChange = <K extends keyof RegisterFormValues>(
    key: K,
    value: RegisterFormValues[K],
  ) => {
    setValues(current => ({...current, [key]: value}));
    setFieldErrors(current => ({...current, [key]: undefined}));

    if (key === 'taqueriaName') {
      setStage('form');
      resetTaqueriaLookup();
    }
  };

  const handleContinue = async () => {
    const nextFieldErrors = getBaseFieldErrors(values);
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    const lookup = await inspectTaqueria(values.taqueriaName);

    if (!lookup) {
      return;
    }

    setStage(lookup.taqueria ? 'existing-taqueria' : 'create-taqueria');
  };

  const handleRegister = async () => {
    const nextFieldErrors = {
      ...getBaseFieldErrors(values),
      ...(stage === 'create-taqueria' ? getTaqueriaFieldErrors(values) : {}),
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    const registeredUser = await register(values);

    if (registeredUser) {
      handleSafeGoBack();
    }
  };

  const primaryLabel =
    stage === 'form' ? 'Continuar' : taqueriaLookup?.taqueria ? 'Unirme a la taqueria' : 'Crear cuenta';

  return (
    <Screen contentStyle={styles.screen} scrollable>
      <View style={[styles.card, isTablet && styles.cardTablet]}>
        <Text style={styles.eyebrow}>Registro multi-taqueria</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Crea un usuario nuevo y vincularlo a una taqueria existente o crea una nueva en el mismo flujo.
        </Text>

        <AuthInput
          autoCapitalize="words"
          error={fieldErrors.name}
          label="Nombre"
          onChangeText={text => handleChange('name', text)}
          placeholder="Nombre del empleado"
          value={values.name}
        />

        <AuthInput
          autoCapitalize="none"
          autoCorrect={false}
          error={fieldErrors.email}
          keyboardType="email-address"
          label="Correo"
          onChangeText={text => handleChange('email', text)}
          placeholder="correo@taqueria.com"
          value={values.email}
        />

        <AuthInput
          error={fieldErrors.password}
          label="Contrasena"
          onChangeText={text => handleChange('password', text)}
          placeholder="Minimo 6 caracteres"
          secureTextEntry
          value={values.password}
        />

        <AuthInput
          error={fieldErrors.confirmPassword}
          label="Confirmar contrasena"
          onChangeText={text => handleChange('confirmPassword', text)}
          placeholder="Repite la contrasena"
          secureTextEntry
          value={values.confirmPassword}
        />

        <RoleSelector
          error={fieldErrors.role}
          onChange={role => handleChange('role', role)}
          value={values.role}
        />

        <AuthInput
          autoCapitalize="words"
          error={fieldErrors.taqueriaName}
          label="Nombre de la taqueria"
          onChangeText={text => handleChange('taqueriaName', text)}
          placeholder="Taqueria Los Compas"
          value={values.taqueriaName}
        />

        {stage === 'existing-taqueria' && taqueriaLookup?.taqueria ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Taqueria encontrada</Text>
            <Text style={styles.noticeText}>
              Se te vinculara a {taqueriaLookup.taqueria.name} en {taqueriaLookup.taqueria.city}, {taqueriaLookup.taqueria.state}.
            </Text>
          </View>
        ) : null}

        {stage === 'create-taqueria' ? (
          <View style={styles.stepTwoSection}>
            <Text style={styles.sectionTitle}>Nueva taqueria</Text>
            <Text style={styles.sectionText}>
              No encontramos una coincidencia. Completa la informacion para crearla.
            </Text>

            <AuthInput
              error={fieldErrors.address}
              label="Direccion"
              multiline
              onChangeText={text => handleChange('address', text)}
              placeholder="Calle, numero y colonia"
              style={styles.multilineInput}
              value={values.address}
            />

            <AuthInput
              error={fieldErrors.city}
              label="Ciudad"
              onChangeText={text => handleChange('city', text)}
              placeholder="Ciudad"
              value={values.city}
            />

            <AuthInput
              error={fieldErrors.state}
              label="Estado"
              onChangeText={text => handleChange('state', text)}
              placeholder="Estado"
              value={values.state}
            />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton
          label={primaryLabel}
          loading={isLoading}
          onPress={stage === 'form' ? handleContinue : handleRegister}
        />

        {stage !== 'form' ? (
          <AppButton
            label="Cambiar taqueria"
            onPress={() => {
              setStage('form');
              resetTaqueriaLookup();
            }}
            variant="secondary"
          />
        ) : null}

        <AppButton
          label="Ya tengo acceso"
          onPress={handleSafeGoBack}
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
    maxWidth: 560,
    width: '100%',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  noticeCard: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  noticeText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  noticeTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  screen: {
    justifyContent: 'center',
  },
  sectionText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  stepTwoSection: {
    gap: theme.spacing.md,
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
