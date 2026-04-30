import {useCallback, useState} from 'react';
import {authService} from '../services/authService';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function mapLoginError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'No se pudo iniciar sesion.';
  }

  const firebaseCode = (error as {code?: string}).code;

  if (firebaseCode === 'auth/invalid-credential') {
    return 'Correo o contrasena incorrectos.';
  }

  if (firebaseCode === 'auth/user-not-found') {
    return 'No existe una cuenta con ese correo.';
  }

  if (firebaseCode === 'auth/wrong-password') {
    return 'La contrasena es incorrecta.';
  }

  return error.message || 'No se pudo iniciar sesion.';
}

export function useLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim()) {
      setError('El correo es obligatorio.');
      return false;
    }

    if (!isValidEmail(email)) {
      setError('Captura un correo valido.');
      return false;
    }

    if (!password) {
      setError('La contrasena es obligatoria.');
      return false;
    }

    try {
      console.log("entra a login 1")
      setError(null);
      setIsLoading(true);

      await authService.login(email, password);
      console.log("entra a login 2")

      return true;
    } catch (loginError) {
      setError(mapLoginError(loginError));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    error,
    isLoading,
    login,
  };
}
