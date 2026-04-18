import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const firebaseApp = firebase.app();
export const firebaseAuth = auth();
export const firestoreDb = firestore();
