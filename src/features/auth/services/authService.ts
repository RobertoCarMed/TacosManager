import {
  FirebaseAuthTypes,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import {AppUser} from '../../../shared/types';
import {firebaseModularAuth} from '../../../services/firebase/config';

let sessionUser: AppUser | null = null;

export const authService = {
  async createUserWithEmailAndPassword(email: string, password: string) {
    return createUserWithEmailAndPassword(firebaseModularAuth, email.trim(), password);
  },

  async deleteUser(user: FirebaseAuthTypes.User) {
    await user.delete();
  },

  getSessionUser() {
    return sessionUser;
  },

  setSessionUser(user: AppUser | null) {
    sessionUser = user;
  },

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(firebaseModularAuth, email.trim(), password);
  },

  async signOut() {
    sessionUser = null;
    await signOut(firebaseModularAuth);
  },

  subscribe(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return onAuthStateChanged(firebaseModularAuth, firebaseUser => {
      if (!firebaseUser) {
        sessionUser = null;
        callback(null);
        return;
      }

      callback(firebaseUser);
    });
  },
};
