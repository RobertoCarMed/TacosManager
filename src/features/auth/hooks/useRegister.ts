import {useCallback, useState} from 'react';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {authService} from '../services/authService';
import {taqueriaService} from '../services/taqueriaService';
import {userService} from '../services/userService';
import {
  RegisterFormValues,
  RegisterPayload,
  RegisteredUserProfile,
  TaqueriaLookupResult,
} from '../types';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function buildValidationError(values: RegisterFormValues) {
  if (!values.name.trim()) {
    return 'El nombre es obligatorio.';
  }

  if (!values.email.trim()) {
    return 'El correo es obligatorio.';
  }

  if (!isValidEmail(values.email)) {
    return 'Captura un correo valido.';
  }

  if (!values.password) {
    return 'La contrasena es obligatoria.';
  }

  if (values.password.length < 6) {
    return 'La contrasena debe tener al menos 6 caracteres.';
  }

  if (values.password !== values.confirmPassword) {
    return 'Las contrasenas no coinciden.';
  }

  if (!values.role) {
    return 'Selecciona un rol para continuar.';
  }

  if (!values.taqueriaName.trim()) {
    return 'El nombre de la taqueria es obligatorio.';
  }

  return null;
}

function buildCreateTaqueriaError(values: RegisterFormValues) {
  if (!values.address.trim()) {
    return 'La direccion es obligatoria para crear una taqueria.';
  }

  if (!values.city.trim()) {
    return 'La ciudad es obligatoria para crear una taqueria.';
  }

  if (!values.state.trim()) {
    return 'El estado es obligatorio para crear una taqueria.';
  }

  return null;
}

function normalizePayload(values: RegisterFormValues): RegisterPayload {
  return {
    email: values.email.trim().toLowerCase(),
    name: values.name.trim(),
    password: values.password,
    role: values.role as RegisterPayload['role'],
    taqueriaName: values.taqueriaName.trim(),
  };
}

export function useRegister() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taqueriaLookup, setTaqueriaLookup] = useState<TaqueriaLookupResult | null>(null);

  const inspectTaqueria = useCallback(async (taqueriaName: string) => {
    if (!taqueriaName.trim()) {
      const message = 'El nombre de la taqueria es obligatorio.';
      setError(message);
      return null;
    }

    try {
      setError(null);
      setIsLoading(true);

      const lookup = await taqueriaService.findTaqueriaByName(taqueriaName);
      setTaqueriaLookup(lookup);

      return lookup;
    } catch (lookupError) {
      const message =
        lookupError instanceof Error
          ? lookupError.message
          : 'No se pudo validar la taqueria.';

      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetTaqueriaLookup = useCallback(() => {
    setTaqueriaLookup(null);
    setError(null);
  }, []);

  const register = useCallback(
    async (values: RegisterFormValues) => {
      const validationError = buildValidationError(values);

      if (validationError) {
        setError(validationError);
        return null;
      }

      const payload = normalizePayload(values);
      let credential: FirebaseAuthTypes.UserCredential | null = null;

      try {
        setError(null);
        setIsLoading(true);

        const lookup =
          taqueriaLookup?.normalizedName ===
          taqueriaService.normalizeTaqueriaName(values.taqueriaName)
            ? taqueriaLookup
            : await taqueriaService.findTaqueriaByName(values.taqueriaName);

        setTaqueriaLookup(lookup);

        if (!lookup.taqueria) {
          const taqueriaValidationError = buildCreateTaqueriaError(values);

          if (taqueriaValidationError) {
            setError(taqueriaValidationError);
            return null;
          }
        }

        credential = await authService.createUserWithEmailAndPassword(
          payload.email,
          payload.password,
        );

        const taqueria =
          lookup.taqueria ??
          (await taqueriaService.createTaqueria({
            address: values.address.trim(),
            city: values.city.trim(),
            name: payload.taqueriaName,
            normalizedName: lookup.normalizedName,
            ownerId: credential.user.uid,
            state: values.state.trim(),
          }));

        const registeredProfile: RegisteredUserProfile =
          await userService.createUserProfile({
            email: payload.email,
            id: credential.user.uid,
            name: payload.name,
            role: payload.role,
            taqueriaId: taqueria.id,
          });

        authService.setSessionUser(registeredProfile);

        return registeredProfile;
      } catch (registrationError) {
        const message =
          registrationError instanceof Error
            ? registrationError.message
            : 'No se pudo completar el registro.';

        setError(message);

        if (credential?.user) {
          try {
            await authService.deleteUser(credential.user);
          } catch {
            // Best-effort cleanup if Firestore creation fails after Auth succeeds.
          }
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [taqueriaLookup],
  );

  return {
    error,
    inspectTaqueria,
    isLoading,
    register,
    resetTaqueriaLookup,
    taqueriaLookup,
  };
}
