import storage from '@react-native-firebase/storage';
import {
  FirebaseFirestoreTypes,
  collection,
  doc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { firestoreModularDb } from '../../../services/firebase/config';
import {
  logFirestoreSnapshot,
  logFirestoreSubscriptionEnd,
  logFirestoreSubscriptionError,
  logFirestoreSubscriptionStart,
  runFirestoreOperation,
  toFirestoreUserError,
} from '../../../services/firebase/firestoreOperations';
import { CreateProductPayload, Product, UpdateProductPayload } from '../types';

type FetchProductsOptions = {
  source?: 'cache-first' | 'server';
};

const PRODUCT_READ_TIMEOUT_MS = 12000;
const PRODUCT_WRITE_TIMEOUT_MS = 20000;
const productCache = new Map<string, Product[]>();

function getProductsCollection(taqueriaId: string) {
  return collection(
    doc(collection(firestoreModularDb, 'taquerias'), taqueriaId),
    'products',
  );
}

function sortProducts(products: Product[]) {
  return [...products].sort((a, b) => a.name.localeCompare(b.name));
}

function setCachedProducts(taqueriaId: string, products: Product[]) {
  productCache.set(taqueriaId, sortProducts(products));
}

function updateCachedProduct(taqueriaId: string, product: Product) {
  const current = productCache.get(taqueriaId) ?? [];
  const withoutProduct = current.filter(item => item.id !== product.id);
  setCachedProducts(taqueriaId, [...withoutProduct, product]);
}

function sanitizeFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

async function uploadProductImage(
  taqueriaId: string,
  productName: string,
  imageUri: string,
) {
  const safeName = sanitizeFileName(productName);
  const fileExtension = imageUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `taquerias/${taqueriaId}/products/${Date.now()}-${safeName}.${fileExtension}`;
  const imageReference = storage().ref(path);

  await imageReference.putFile(imageUri);
  return imageReference.getDownloadURL();
}

function mapProduct(
  id: string,
  data: FirebaseFirestoreTypes.DocumentData,
): Product {
  const complements = Array.isArray(data.complements)
    ? data.complements
        .filter(
          (complement): complement is string => typeof complement === 'string',
        )
        .map(complement => complement.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    complements,
    createdAt: Number(data.createdAt ?? Date.now()),
    id,
    imageUrl:
      typeof data.imageUrl === 'string' && data.imageUrl.length > 0
        ? data.imageUrl
        : undefined,
    name: String(data.name ?? ''),
    price: Number(data.price ?? 0),
    taqueriaId: String(data.taqueriaId ?? ''),
  };
}

function sanitizeComplements(complements: string[]) {
  return complements
    .map(complement => complement.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export const productService = {
  getCachedProducts(taqueriaId: string): Product[] {
    return productCache.get(taqueriaId) ?? [];
  },

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const productsCollection = getProductsCollection(payload.taqueriaId);
    const productsReference = doc(productsCollection);

    let imageUrl: string | undefined;

    if (payload.imageUri) {
      try {
        imageUrl = await uploadProductImage(
          payload.taqueriaId,
          payload.name,
          payload.imageUri,
        );
      } catch {
        // MVP-safe fallback: keep product creation working even if Storage is unavailable.
        imageUrl = undefined;
      }
    }

    const baseProduct = {
      complements: sanitizeComplements(payload.complements),
      createdAt: Date.now(),
      id: productsReference.id,
      name: payload.name.trim(),
      price: payload.price,
      taqueriaId: payload.taqueriaId,
    };

    const product: Product = imageUrl
      ? { ...baseProduct, imageUrl }
      : baseProduct;

    await runFirestoreOperation(
      'products.createProduct',
      () => setDoc(productsReference, product),
      {
        diagnostics: {
          productId: productsReference.id,
          taqueriaId: payload.taqueriaId,
        },
        fallbackMessage: 'No se pudo guardar el producto.',
        timeoutMs: PRODUCT_WRITE_TIMEOUT_MS,
      },
    );

    updateCachedProduct(payload.taqueriaId, product);

    return product;
  },

  async fetchProducts(
    taqueriaId: string,
    options: FetchProductsOptions = {},
  ): Promise<Product[]> {
    const cachedProducts = productCache.get(taqueriaId);
    if ((options.source ?? 'cache-first') === 'cache-first' && cachedProducts) {
      return cachedProducts;
    }

    const productsCollection = getProductsCollection(taqueriaId);
    const productsQuery = query(productsCollection, orderBy('name', 'asc'));
    const snapshot = await runFirestoreOperation(
      options.source === 'server'
        ? 'products.fetchProducts.server'
        : 'products.fetchProducts',
      () =>
        options.source === 'server'
          ? getDocsFromServer(productsQuery)
          : getDocs(productsQuery),
      {
        diagnostics: {
          source: options.source ?? 'cache-first',
          taqueriaId,
        },
        fallbackMessage: 'No se pudieron cargar los productos.',
        timeoutMs: PRODUCT_READ_TIMEOUT_MS,
      },
    );

    const products = snapshot.docs.map(snapshotItem =>
      mapProduct(snapshotItem.id, snapshotItem.data()),
    );
    setCachedProducts(taqueriaId, products);

    return productCache.get(taqueriaId) ?? products;
  },

  subscribeToProducts(
    taqueriaId: string,
    onData: (products: Product[]) => void,
    onError: (error: Error) => void,
  ) {
    const cachedProducts = productCache.get(taqueriaId);
    if (cachedProducts) {
      onData(cachedProducts);
    }

    const productsQuery = query(
      getProductsCollection(taqueriaId),
      orderBy('name', 'asc'),
    );
    const subscriptionName = 'products.subscribeToProducts';
    const subscriptionStartedAt = logFirestoreSubscriptionStart(
      subscriptionName,
      {taqueriaId},
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      snapshot => {
        logFirestoreSnapshot(subscriptionName, subscriptionStartedAt, snapshot);
        const products = snapshot.docs.map(snapshotItem =>
          mapProduct(snapshotItem.id, snapshotItem.data()),
        );
        setCachedProducts(taqueriaId, products);
        onData(productCache.get(taqueriaId) ?? products);
      },
      error => {
        logFirestoreSubscriptionError(subscriptionName, error);
        onError(
          toFirestoreUserError(error, 'No se pudieron sincronizar los productos.'),
        );
      },
    );

    return () => {
      logFirestoreSubscriptionEnd(subscriptionName);
      unsubscribe();
    };
  },

  async updateProduct(payload: UpdateProductPayload): Promise<Product> {
    const productsCollection = getProductsCollection(payload.taqueriaId);
    const productRef = doc(productsCollection, payload.productId);

    let imageUrl = payload.existingImageUrl;

    if (payload.newImageUri) {
      try {
        const newImageUrl = await uploadProductImage(
          payload.taqueriaId,
          payload.name,
          payload.newImageUri,
        );
        imageUrl = newImageUrl;

        if (payload.existingImageUrl) {
          try {
            const oldRef = storage().refFromURL(payload.existingImageUrl);
            await oldRef.delete();
          } catch (e) {
            console.log('Failed to delete old image', e);
          }
        }
      } catch (error) {
        console.error('Failed to upload new image:', error);
      }
    }

    const updates: Partial<Product> = {
      name: payload.name.trim(),
      price: payload.price,
    };

    if (imageUrl && imageUrl !== payload.existingImageUrl) {
      updates.imageUrl = imageUrl;
    }

    await runFirestoreOperation(
      'products.updateProduct',
      () => updateDoc(productRef, updates),
      {
        diagnostics: {
          productId: payload.productId,
          taqueriaId: payload.taqueriaId,
        },
        fallbackMessage: 'No se pudo actualizar el producto.',
        timeoutMs: PRODUCT_WRITE_TIMEOUT_MS,
      },
    );

    const cachedProduct = productCache
      .get(payload.taqueriaId)
      ?.find(product => product.id === payload.productId);

    if (cachedProduct) {
      const updatedProduct: Product = {
        ...cachedProduct,
        ...updates,
      };
      updateCachedProduct(payload.taqueriaId, updatedProduct);
      return updatedProduct;
    }

    const updatedDoc = await runFirestoreOperation(
      'products.updateProduct.readBack.server',
      () => getDocFromServer(productRef),
      {
        diagnostics: {
          productId: payload.productId,
          taqueriaId: payload.taqueriaId,
        },
        fallbackMessage: 'No se encontro el producto actualizado.',
        timeoutMs: PRODUCT_READ_TIMEOUT_MS,
      },
    );
    if (!updatedDoc.exists() || !updatedDoc.data()) {
      throw new Error('No se encontro el producto actualizado.');
    }

    const updatedProduct = mapProduct(
      updatedDoc.id,
      updatedDoc.data() as FirebaseFirestoreTypes.DocumentData,
    );
    updateCachedProduct(payload.taqueriaId, updatedProduct);
    return updatedProduct;
  },
};
