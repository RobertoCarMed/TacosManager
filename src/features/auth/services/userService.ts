import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {APP_CONFIG} from '../../../shared/constants';
import {firestoreDb} from '../../../services/firebase/config';
import {CreateUserProfileParams, RegisteredUserProfile} from '../types';

function mapCreatedAt(
  value: FirebaseFirestoreTypes.Timestamp | number | string | undefined,
) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? Date.now() : parsedValue;
  }

  return value?.toDate?.().getTime() ?? Date.now();
}

function mapUserDocument(
  id: string,
  data: FirebaseFirestoreTypes.DocumentData,
): RegisteredUserProfile {
  return {
    createdAt: mapCreatedAt(data.createdAt),
    email: String(data.email ?? ''),
    id,
    name: String(data.name ?? APP_CONFIG.defaultUserName),
    role: data.role,
    taqueriaId: String(data.taqueriaId ?? APP_CONFIG.defaultTaqueriaId),
  };
}

export const userService = {
  async createUserProfile({
    email,
    id,
    name,
    role,
    taqueriaId,
  }: CreateUserProfileParams) {
    const createdAt = Date.now();

    await firestoreDb.collection('users').doc(id).set({
      createdAt,
      email: email.trim().toLowerCase(),
      id,
      name: name.trim(),
      role,
      taqueriaId,
    });

    return {
      createdAt,
      email: email.trim().toLowerCase(),
      id,
      name: name.trim(),
      role,
      taqueriaId,
    } satisfies RegisteredUserProfile;
  },

  subscribeToUserProfile(
    userId: string,
    onData: (user: RegisteredUserProfile | null) => void,
    onError: (error: Error) => void,
  ) {
    return firestoreDb
      .collection('users')
      .doc(userId)
      .onSnapshot(
        snapshot => {
          if (!snapshot.exists) {
            onData(null);
            return;
          }

          const data = snapshot.data();

          if (!data) {
            onData(null);
            return;
          }

          onData(mapUserDocument(snapshot.id, data));
        },
        error => {
          onError(error);
        },
      );
  },

  async getUserById(userId: string): Promise<RegisteredUserProfile | null> {
    const snapshot = await firestoreDb.collection('users').doc(userId).get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data();

    if (!data) {
      return null;
    }

    return mapUserDocument(snapshot.id, data);
  },
};
