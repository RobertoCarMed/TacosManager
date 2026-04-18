import {useEffect, useState} from 'react';
import {Product} from '../types';
import {productService} from '../services/productService';

export function useProducts(taqueriaId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      if (!taqueriaId) {
        if (isMounted) {
          setProducts([]);
          setError('No hay una taqueria activa.');
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        const nextProducts = await productService.fetchProducts(taqueriaId);

        if (isMounted) {
          setProducts(nextProducts);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los productos.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [taqueriaId]);

  return {
    error,
    isLoading,
    products,
  };
}
