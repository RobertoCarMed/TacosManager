import {getApp} from '@react-native-firebase/app';
import {getAuth} from '@react-native-firebase/auth';
import {getFirestore} from '@react-native-firebase/firestore';

export const firebaseApp = getApp();
export const firebaseModularAuth = getAuth(firebaseApp);
export const firestoreModularDb = getFirestore(firebaseApp);
