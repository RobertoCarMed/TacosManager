import {useCallback, useState} from 'react';
import {AppUser, ApiTaqueria} from '../../../shared/types';
import {authService} from '../services/authService';
import {useAuth} from '../context/AuthContext';
import {
  ApiRegisterPhase1Result,
  RegisterAction,
  RegisterFormValues,
} from '../types';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function buildBaseValidationError(values: RegisterFormValues) {
  if (!values.name.trim()) {
    return 'El nombre es obligatorio.';
  }

  if (!values.email.trim()) {
    return 'El correo es obligatorio.';
  }

  if (!isValidEmail(values.email)) {
    return 'Captura un correo válido.';
  }

  if (!values.password) {
    return 'La contraseña es obligatoria.';
  }

  if (values.password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  if (values.password !== values.confirmPassword) {
    return 'Las contraseñas no coinciden.';
  }

  if (!values.role) {
    return 'Selecciona un rol para continuar.';
  }

  if (!values.taqueriaName.trim()) {
    return 'El nombre de la taquería es obligatorio.';
  }

  return null;
}

function buildCreateTaqueriaError(values: RegisterFormValues) {
  if (!values.address.trim()) {
    return 'La dirección es obligatoria para crear una taquería.';
  }

  if (!values.city.trim()) {
    return 'La ciudad es obligatoria para crear una taquería.';
  }

  if (!values.state.trim()) {
    return 'El estado es obligatorio para crear una taquería.';
  }

  return null;
}

export function useRegister() {
  const {signIn} = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phase1Result, setPhase1Result] =
    useState<ApiRegisterPhase1Result | null>(null);

  const inspectTaqueria = useCallback(
    async (values: RegisterFormValues) => {
      const validationError = buildBaseValidationError(values);
      if (validationError) {
        setError(validationError);
        return null;
      }

      try {
        setError(null);
        setIsLoading(true);

        const result = await authService.registerDiscoverTaqueria(values);
        setPhase1Result(result);

        return result;
      } catch (lookupError) {
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : 'No se pudo validar la taquería.',
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const resetSearch = useCallback(() => {
    setPhase1Result(null);
    setError(null);
  }, []);

  const register = useCallback(
    async (
      values: RegisterFormValues,
      action: RegisterAction,
    ): Promise<boolean> => {
      const baseError = buildBaseValidationError(values);
      if (baseError) {
        setError(baseError);
        return false;
      }

      if (action.type === 'create') {
        const taqueriaError = buildCreateTaqueriaError(values);
        if (taqueriaError) {
          setError(taqueriaError);
          return false;
        }
      }

      try {
        setError(null);
        setIsLoading(true);

        let result: {user: AppUser; taqueria: ApiTaqueria};

        if (action.type === 'join') {
          result = await authService.registerJoinTaqueria(
            values,
            action.restaurantCode,
          );
        } else {
          result = await authService.registerCreateTaqueria(values);
        }

        signIn(result.user, result.taqueria);
        return true;
      } catch (registrationError) {
        setError(
          registrationError instanceof Error
            ? registrationError.message
            : 'No se pudo completar el registro.',
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signIn],
  );

  return {
    error,
    inspectTaqueria,
    isLoading,
    phase1Result,
    register,
    resetSearch,
  };
}
