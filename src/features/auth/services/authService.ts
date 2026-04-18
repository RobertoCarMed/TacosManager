import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {AppUser} from '../../../shared/types';
import {firebaseAuth} from '../../../services/firebase/config';

let sessionUser: AppUser | null = null;

export const authService = {
  async createUserWithEmailAndPassword(email: string, password: string) {
    return firebaseAuth.createUserWithEmailAndPassword(email.trim(), password);
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
    return firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
  },

  async signOut() {
    sessionUser = null;
    await firebaseAuth.signOut();
  },

  subscribe(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return firebaseAuth.onAuthStateChanged(firebaseUser => {
      if (!firebaseUser) {
        sessionUser = null;
        callback(null);
        return;
      }

      callback(firebaseUser);
    });
  },
};
