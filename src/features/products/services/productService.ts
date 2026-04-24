import storage from '@react-native-firebase/storage';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { firestoreDb } from '../../../services/firebase/config';
import { CreateProductPayload, Product, UpdateProductPayload } from '../types';

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
  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const productsReference = firestoreDb
      .collection('taquerias')
      .doc(payload.taqueriaId)
      .collection('products')
      .doc();

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

    await productsReference.set(product);

    return product;
  },

  async fetchProducts(taqueriaId: string): Promise<Product[]> {
    const snapshot = await firestoreDb
      .collection('taquerias')
      .doc(taqueriaId)
      .collection('products')
      .orderBy('name', 'asc')
      .get();

    return snapshot.docs.map(snapshotItem =>
      mapProduct(snapshotItem.id, snapshotItem.data()),
    );
  },

  async updateProduct(payload: UpdateProductPayload): Promise<Product> {
    const productRef = firestoreDb
      .collection('taquerias')
      .doc(payload.taqueriaId)
      .collection('products')
      .doc(payload.productId);

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

    // If we have a new image URL or kept the old one
    if (imageUrl !== payload.existingImageUrl) {
      updates.imageUrl = imageUrl;
    }

    await productRef.update(updates);

    const updatedDoc = await productRef.get();
    if (!updatedDoc.exists || !updatedDoc.data()) {
      throw new Error('No se encontro el producto actualizado.');
    }

    return mapProduct(
      updatedDoc.id,
      updatedDoc.data() as FirebaseFirestoreTypes.DocumentData,
    );
  },
};
