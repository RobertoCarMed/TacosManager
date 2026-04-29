import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppUser} from '../../../shared/types';
import {authService} from '../services/authService';
import {userService} from '../services/userService';

type AuthContextValue = {
  error: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  user: AppUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const PROFILE_LOAD_TIMEOUT_MS = 15000;

export function AuthProvider({children}: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userProfileUnsubscribeRef = useRef<undefined | (() => void)>(undefined);
  const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearProfileTimeout = useCallback(() => {
    if (!profileTimeoutRef.current) {
      return;
    }

    clearTimeout(profileTimeoutRef.current);
    profileTimeoutRef.current = undefined;
  }, []);

  useEffect(() => {
    const unsubscribeAuth = authService.subscribe(firebaseUser => {
      clearProfileTimeout();
      userProfileUnsubscribeRef.current?.();
      userProfileUnsubscribeRef.current = undefined;

      if (!firebaseUser) {
        setError(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const sessionUser = authService.getSessionUser();

      if (sessionUser?.id === firebaseUser.uid) {
        setUser(sessionUser);
      }

      setError(null);
      setIsLoading(true);
      profileTimeoutRef.current = setTimeout(() => {
        setError('No se pudo cargar el perfil. Verifica tu conexion e intenta de nuevo.');
        setIsLoading(false);
      }, PROFILE_LOAD_TIMEOUT_MS);

      userProfileUnsubscribeRef.current = userService.subscribeToUserProfile(
        firebaseUser.uid,
        nextUser => {
          clearProfileTimeout();
          setUser(nextUser ?? authService.getSessionUser());
          setIsLoading(false);
        },
        profileError => {
          clearProfileTimeout();
          setError(profileError.message);
          setUser(authService.getSessionUser());
          setIsLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      clearProfileTimeout();
      userProfileUnsubscribeRef.current?.();
    };
  }, [clearProfileTimeout]);

  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'No se pudo cerrar sesion.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      error,
      isLoading,
      signOut: handleSignOut,
      user,
    }),
    [error, handleSignOut, isLoading, user],
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
