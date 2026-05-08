import {
  FirebaseFirestoreTypes,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from '@react-native-firebase/firestore';
import {APP_CONFIG} from '../../../shared/constants';
import {firestoreModularDb} from '../../../services/firebase/config';
import {
  logFirestoreSnapshot,
  logFirestoreSubscriptionEnd,
  logFirestoreSubscriptionError,
  logFirestoreSubscriptionStart,
  runFirestoreOperation,
  toFirestoreUserError,
} from '../../../services/firebase/firestoreOperations';
import {CreateUserProfileParams, RegisteredUserProfile} from '../types';

const USER_PROFILE_READ_TIMEOUT_MS = 12000;
const USER_PROFILE_WRITE_TIMEOUT_MS = 20000;

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
    const userRef = doc(firestoreModularDb, 'users', id);
    await runFirestoreOperation(
      'users.createUserProfile',
      () =>
        setDoc(userRef, {
          createdAt,
          email: email.trim().toLowerCase(),
          id,
          name: name.trim(),
          role,
          taqueriaId,
        }),
      {
        diagnostics: {
          role,
          taqueriaId,
          userId: id,
        },
        fallbackMessage: 'No se pudo crear el perfil de usuario.',
        timeoutMs: USER_PROFILE_WRITE_TIMEOUT_MS,
      },
    );

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
    const userRef = doc(firestoreModularDb, 'users', userId);
    const subscriptionName = 'users.subscribeToUserProfile';
    const subscriptionStartedAt = logFirestoreSubscriptionStart(
      subscriptionName,
      {userId},
    );

    const unsubscribe = onSnapshot(
      userRef,
      snapshot => {
        const exists = snapshot.exists();
        logFirestoreSnapshot(subscriptionName, subscriptionStartedAt, {
          docs: exists ? [snapshot.id] : [],
          metadata: snapshot.metadata,
        });
        if (!exists) {
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
        logFirestoreSubscriptionError(subscriptionName, error);
        onError(
          toFirestoreUserError(error, 'No se pudo sincronizar el perfil.'),
        );
      },
    );

    return () => {
      logFirestoreSubscriptionEnd(subscriptionName);
      unsubscribe();
    };
  },

  async getUserById(userId: string): Promise<RegisteredUserProfile | null> {
    const userRef = doc(firestoreModularDb, 'users', userId);
    const snapshot = await runFirestoreOperation(
      'users.getUserById',
      () => getDoc(userRef),
      {
        diagnostics: {userId},
        fallbackMessage: 'No se pudo cargar el perfil de usuario.',
        timeoutMs: USER_PROFILE_READ_TIMEOUT_MS,
      },
    );

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    if (!data) {
      return null;
    }

    return mapUserDocument(snapshot.id, data);
  },
};
