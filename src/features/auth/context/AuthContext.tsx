import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {AppUser, ApiTaqueria} from '../../../shared/types';
import {authService} from '../services/authService';

type AuthContextValue = {
  error: string | null;
  isLoading: boolean;
  signIn: (user: AppUser, taqueria: ApiTaqueria) => void;
  signOut: () => Promise<void>;
  taqueria: ApiTaqueria | null;
  user: AppUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [taqueria, setTaqueria] = useState<ApiTaqueria | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    authService
      .restoreSession()
      .then(result => {
        if (cancelled) {
          return;
        }
        if (result) {
          setUser(result.user);
          setTaqueria(result.taqueria);
        }
      })
      .catch(() => {
        // Token inválido o expirado — el authService ya lo limpió
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((nextUser: AppUser, nextTaqueria: ApiTaqueria) => {
    setUser(nextUser);
    setTaqueria(nextTaqueria);
    setError(null);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
      setTaqueria(null);
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : 'No se pudo cerrar sesión.',
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      error,
      isLoading,
      signIn,
      signOut: handleSignOut,
      taqueria,
      user,
    }),
    [error, handleSignOut, isLoading, signIn, taqueria, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
