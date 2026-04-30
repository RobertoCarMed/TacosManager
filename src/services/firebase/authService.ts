import {
  FirebaseAuthTypes,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from '@react-native-firebase/auth';
import {APP_CONFIG} from '../../shared/constants';
import {AppUser, UserRole} from '../../shared/types';
import {firebaseModularAuth} from './config';

let sessionUser: AppUser | null = null;

type SignInParams = {
  name: string;
  role: UserRole;
  taqueriaId: string;
};

function buildFallbackUser(firebaseUser: FirebaseAuthTypes.User): AppUser {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName ?? APP_CONFIG.defaultUserName,
    role: 'waiter',
    taqueriaId: APP_CONFIG.defaultTaqueriaId,
  };
}

export const authService = {
  async signIn({name, role, taqueriaId}: SignInParams) {
    const credential = await signInAnonymously(firebaseModularAuth);

    sessionUser = {
      id: credential.user.uid,
      name: name.trim() || APP_CONFIG.defaultUserName,
      role,
      taqueriaId: taqueriaId.trim() || APP_CONFIG.defaultTaqueriaId,
    };

    return sessionUser;
  },

  async signOut() {
    sessionUser = null;
    await signOut(firebaseModularAuth);
  },

  subscribe(callback: (user: AppUser | null) => void) {
    return onAuthStateChanged(firebaseModularAuth, firebaseUser => {
      if (!firebaseUser) {
        sessionUser = null;
        callback(null);
        return;
      }

      // This keeps the scaffold simple today; production apps should hydrate role/profile from Firestore or claims.
      const nextUser =
        sessionUser?.id === firebaseUser.uid ? sessionUser : buildFallbackUser(firebaseUser);

      sessionUser = nextUser;
      callback(nextUser);
    });
  },
};
