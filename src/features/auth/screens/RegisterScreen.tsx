import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AuthStackParamList} from '../../../navigation/types';
import {AppButton, Screen} from '../../../shared/components';
import {theme} from '../../../shared/constants';
import {useResponsive} from '../../../shared/hooks';
import {AuthInput} from '../components/AuthInput';
import {RoleSelector} from '../components/RoleSelector';
import {useRegister} from '../hooks/useRegister';
import {ApiTaqueriaMatch, RegisterFormValues} from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;
type RegisterStage = 'form' | 'matches-found' | 'create-taqueria';

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
        : 'Las contraseñas no coinciden.',
    email:
      !values.email.trim()
        ? 'Captura un correo.'
        : isValidEmail(values.email)
          ? undefined
          : 'Correo inválido.',
    name: values.name.trim() ? undefined : 'Captura el nombre.',
    password:
      !values.password
        ? 'Captura una contraseña.'
        : values.password.length >= 6
          ? undefined
          : 'Mínimo 6 caracteres.',
    role: values.role ? undefined : 'Selecciona un rol.',
    taqueriaName: values.taqueriaName.trim()
      ? undefined
      : 'Captura el nombre de la taquería.',
  };
}

function getTaqueriaFieldErrors(values: RegisterFormValues): FieldErrors {
  return {
    address: values.address.trim() ? undefined : 'Captura la dirección.',
    city: values.city.trim() ? undefined : 'Captura la ciudad.',
    state: values.state.trim() ? undefined : 'Captura el estado.',
  };
}

export function RegisterScreen({navigation}: Props) {
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [stage, setStage] = useState<RegisterStage>('form');
  const [selectedRestaurantCode, setSelectedRestaurantCode] = useState<string | null>(null);
  const {
    error,
    inspectTaqueria,
    isLoading,
    phase1Result,
    register,
    resetSearch,
  } = useRegister();
  const {isTablet} = useResponsive();

  const title = useMemo(
    () =>
      isTablet
        ? 'Registra a tu equipo y enlázalo a una taquería'
        : 'Registro',
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
      setSelectedRestaurantCode(null);
      resetSearch();
    }
  };

  const handleContinue = async () => {
    const nextFieldErrors = getBaseFieldErrors(values);
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    const result = await inspectTaqueria(values);

    if (!result) {
      return;
    }

    if (result.taqueriaMatches === 0) {
      setStage('create-taqueria');
    } else {
      setStage('matches-found');
      // Auto-select when there's only one match
      if (result.taquerias?.length === 1) {
        setSelectedRestaurantCode(result.taquerias[0].restaurantCode);
      }
    }
  };

  const handleJoin = async () => {
    if (!selectedRestaurantCode) {
      return;
    }

    const nextFieldErrors = getBaseFieldErrors(values);
    setFieldErrors(nextFieldErrors);
    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    const success = await register(values, {
      type: 'join',
      restaurantCode: selectedRestaurantCode,
    });

    if (success) {
      handleSafeGoBack();
    }
  };

  const handleCreate = async () => {
    const nextFieldErrors = {
      ...getBaseFieldErrors(values),
      ...getTaqueriaFieldErrors(values),
    };
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    const success = await register(values, {type: 'create'});

    if (success) {
      handleSafeGoBack();
    }
  };

  const handleSelectTaqueria = (match: ApiTaqueriaMatch) => {
    setSelectedRestaurantCode(prev =>
      prev === match.restaurantCode ? null : match.restaurantCode,
    );
  };

  const handleGoToCreate = () => {
    setStage('create-taqueria');
    setSelectedRestaurantCode(null);
  };

  const handleResetSearch = () => {
    setStage('form');
    setSelectedRestaurantCode(null);
    resetSearch();
  };

  return (
    <Screen contentStyle={styles.screen} scrollable>
      <View style={[styles.card, isTablet && styles.cardTablet]}>
        <Text style={styles.eyebrow}>Registro multi-taquería</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Crea un usuario nuevo y vincúlalo a una taquería existente o crea una
          nueva en el mismo flujo.
        </Text>

        {/* Base form — always visible */}
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
          label="Contraseña"
          onChangeText={text => handleChange('password', text)}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          value={values.password}
        />

        <AuthInput
          error={fieldErrors.confirmPassword}
          label="Confirmar contraseña"
          onChangeText={text => handleChange('confirmPassword', text)}
          placeholder="Repite la contraseña"
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
          label="Nombre de la taquería"
          onChangeText={text => handleChange('taqueriaName', text)}
          placeholder="Taquería Los Compas"
          value={values.taqueriaName}
        />

        {/* Stage: matches-found — selectable taqueria list */}
        {stage === 'matches-found' && phase1Result?.taquerias ? (
          <View style={styles.matchesSection}>
            <Text style={styles.sectionTitle}>
              {phase1Result.taquerias.length === 1
                ? 'Taquería encontrada'
                : `${phase1Result.taquerias.length} taquerías encontradas`}
            </Text>
            <Text style={styles.sectionText}>{phase1Result.message}</Text>

            {phase1Result.taquerias.map(match => (
              <TouchableOpacity
                key={match.restaurantCode}
                onPress={() => handleSelectTaqueria(match)}
                style={[
                  styles.taqueriaCard,
                  selectedRestaurantCode === match.restaurantCode &&
                    styles.taqueriaCardSelected,
                ]}>
                <Text style={styles.taqueriaName}>{match.name}</Text>
                <Text style={styles.taqueriaCode}>{match.restaurantCode}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Stage: create-taqueria — new taqueria fields */}
        {stage === 'create-taqueria' ? (
          <View style={styles.stepTwoSection}>
            <Text style={styles.sectionTitle}>Nueva taquería</Text>
            <Text style={styles.sectionText}>
              Completa la información para registrar la taquería.
            </Text>

            <AuthInput
              error={fieldErrors.address}
              label="Dirección"
              multiline
              onChangeText={text => handleChange('address', text)}
              placeholder="Calle, número y colonia"
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

        {/* Action buttons by stage */}
        {stage === 'form' ? (
          <>
            <AppButton
              label="Continuar"
              loading={isLoading}
              onPress={handleContinue}
            />
            <AppButton
              label="Ya tengo acceso"
              onPress={handleSafeGoBack}
              variant="secondary"
            />
          </>
        ) : null}

        {stage === 'matches-found' ? (
          <>
            <AppButton
              disabled={!selectedRestaurantCode}
              label="Unirme a esta taquería"
              loading={isLoading}
              onPress={handleJoin}
            />
            <AppButton
              label="Crear nueva taquería"
              onPress={handleGoToCreate}
              variant="secondary"
            />
            <AppButton
              label="Cambiar búsqueda"
              onPress={handleResetSearch}
              variant="secondary"
            />
          </>
        ) : null}

        {stage === 'create-taqueria' ? (
          <>
            <AppButton
              label="Crear cuenta"
              loading={isLoading}
              onPress={handleCreate}
            />
            <AppButton
              label="Cambiar taquería"
              onPress={handleResetSearch}
              variant="secondary"
            />
          </>
        ) : null}
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
  matchesSection: {
    gap: theme.spacing.sm,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
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
  taqueriaCard: {
    backgroundColor: theme.colors.muted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  taqueriaCardSelected: {
    borderColor: theme.colors.primary,
  },
  taqueriaCode: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  taqueriaName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
});
