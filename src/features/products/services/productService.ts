import storage from '@react-native-firebase/storage';
import {apiClient} from '../../../services/api/client';
import {CreateProductPayload, Product, UpdateProductPayload} from '../types';

// ─── API shape (differs from domain Product) ──────────────────────────────────

type ApiProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  complements: string[];
  createdAt: string;
};

// ─── In-memory cache ──────────────────────────────────────────────────────────

const productCache = new Map<string, Product[]>();

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

function removeCachedProduct(taqueriaId: string, productId: string) {
  const current = productCache.get(taqueriaId) ?? [];
  setCachedProducts(taqueriaId, current.filter(item => item.id !== productId));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapApiProduct(apiProduct: ApiProduct, taqueriaId: string): Product {
  return {
    complements: apiProduct.complements,
    createdAt: new Date(apiProduct.createdAt).getTime(),
    id: apiProduct.id,
    imageUrl: apiProduct.imageUrl ?? undefined,
    name: apiProduct.name,
    price: apiProduct.price,
    taqueriaId,
  };
}

function sanitizeFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function sanitizeComplements(complements: string[]) {
  return complements
    .map(c => c.trim())
    .filter(Boolean)
    .slice(0, 3);
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

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }
  const axiosError = error as {response?: {data?: {message?: string | string[]}}};
  const {message} = axiosError.response?.data ?? {};
  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }
  return typeof message === 'string' ? message : fallback;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const productService = {
  getCachedProducts(taqueriaId: string): Product[] {
    return productCache.get(taqueriaId) ?? [];
  },

  async fetchProducts(
    taqueriaId: string,
    options: {forceRefresh?: boolean} = {},
  ): Promise<Product[]> {
    const cached = productCache.get(taqueriaId);
    if (cached && !options.forceRefresh) {
      return cached;
    }

    try {
      const {data} = await apiClient.get<ApiProduct[]>('/products');
      const products = data.map(p => mapApiProduct(p, taqueriaId));
      setCachedProducts(taqueriaId, products);
      return productCache.get(taqueriaId) ?? products;
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'No se pudieron cargar los productos.'),
      );
    }
  },

  subscribeToProducts(
    taqueriaId: string,
    onData: (products: Product[]) => void,
    onError: (error: Error) => void,
  ) {
    let cancelled = false;

    const cached = productCache.get(taqueriaId);
    if (cached) {
      onData(cached);
    }

    this.fetchProducts(taqueriaId, {forceRefresh: true})
      .then(products => {
        if (!cancelled) {
          onData(products);
        }
      })
      .catch(error => {
        if (!cancelled) {
          onError(
            error instanceof Error
              ? error
              : new Error('No se pudieron sincronizar los productos.'),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  },

  async createProduct(payload: CreateProductPayload): Promise<Product> {
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

    try {
      const {data} = await apiClient.post<ApiProduct>('/products', {
        complements: sanitizeComplements(payload.complements),
        ...(imageUrl ? {imageUrl} : {}),
        name: payload.name.trim(),
        price: payload.price,
      });

      const product = mapApiProduct(data, payload.taqueriaId);
      updateCachedProduct(payload.taqueriaId, product);
      return product;
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'No se pudo guardar el producto.'),
      );
    }
  },

  async updateProduct(payload: UpdateProductPayload): Promise<Product> {
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

    const body: Record<string, unknown> = {
      name: payload.name.trim(),
      price: payload.price,
    };

    if (imageUrl !== payload.existingImageUrl) {
      body.imageUrl = imageUrl;
    }

    try {
      const {data} = await apiClient.patch<ApiProduct>(
        `/products/${payload.productId}`,
        body,
      );
      const product = mapApiProduct(data, payload.taqueriaId);
      updateCachedProduct(payload.taqueriaId, product);
      return product;
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'No se pudo actualizar el producto.'),
      );
    }
  },

  async deleteProduct(taqueriaId: string, productId: string): Promise<void> {
    try {
      await apiClient.delete(`/products/${productId}`);
      removeCachedProduct(taqueriaId, productId);
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'No se pudo eliminar el producto.'),
      );
    }
  },
};
