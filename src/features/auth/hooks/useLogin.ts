import {useCallback, useState} from 'react';
import {authService} from '../services/authService';
import {useAuth} from '../context/AuthContext';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function useLogin() {
  const {signIn} = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!email.trim()) {
        setError('El correo es obligatorio.');
        return false;
      }

      if (!isValidEmail(email)) {
        setError('Captura un correo válido.');
        return false;
      }

      if (!password) {
        setError('La contraseña es obligatoria.');
        return false;
      }

      try {
        setError(null);
        setIsLoading(true);

        const result = await authService.login(email, password);
        signIn(result.user, result.taqueria);

        return true;
      } catch (loginError) {
        setError(
          loginError instanceof Error
            ? loginError.message
            : 'No se pudo iniciar sesión.',
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
    isLoading,
    login,
  };
}
