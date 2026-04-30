import {
  FirebaseFirestoreTypes,
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import {firestoreModularDb} from '../../../services/firebase/config';
import {CreateTaqueriaParams, TaqueriaLookupResult, TaqueriaRecord} from '../types';

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

function mapTaqueriaDocument(
  id: string,
  data: FirebaseFirestoreTypes.DocumentData,
): TaqueriaRecord {
  return {
    address: String(data.address ?? ''),
    city: String(data.city ?? ''),
    createdAt: mapCreatedAt(data.createdAt),
    id,
    name: String(data.name ?? ''),
    normalizedName: String(data.normalizedName ?? ''),
    ownerId: String(data.ownerId ?? ''),
    state: String(data.state ?? ''),
  };
}

function normalizeTaqueriaName(value: string) {
  return value.trim().toLowerCase();
}

export const taqueriaService = {
  async createTaqueria({
    address,
    city,
    name,
    normalizedName,
    ownerId,
    state,
  }: CreateTaqueriaParams) {
    const taqueriasCollection = collection(firestoreModularDb, 'taquerias');
    const taqueriaReference = doc(taqueriasCollection);
    const createdAt = Date.now();

    const taqueria: TaqueriaRecord = {
      address: address.trim(),
      city: city.trim(),
      createdAt,
      id: taqueriaReference.id,
      name: name.trim(),
      normalizedName,
      ownerId,
      state: state.trim(),
    };

    await setDoc(taqueriaReference, taqueria);

    return taqueria;
  },

  async findTaqueriaByName(taqueriaName: string): Promise<TaqueriaLookupResult> {
    const normalizedName = normalizeTaqueriaName(taqueriaName);
    const taqueriasCollection = collection(firestoreModularDb, 'taquerias');
    const taqueriaQuery = query(
      taqueriasCollection,
      where('normalizedName', '==', normalizedName),
      limit(1),
    );
    const snapshot = await getDocs(taqueriaQuery);

    return {
      normalizedName,
      taqueria: snapshot.empty
        ? null
        : mapTaqueriaDocument(snapshot.docs[0].id, snapshot.docs[0].data()),
    };
  },

  normalizeTaqueriaName,
};
