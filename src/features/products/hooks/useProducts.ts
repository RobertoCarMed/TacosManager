import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Product} from '../types';
import {productService} from '../services/productService';

export function useProducts(taqueriaId?: string) {
  const [products, setProducts] = useState<Product[]>(() =>
    taqueriaId ? productService.getCachedProducts(taqueriaId) : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!taqueriaId) {
        setProducts([]);
        setError('No hay una taqueria activa.');
        setIsLoading(false);
        return undefined;
      }

      const cachedProducts = productService.getCachedProducts(taqueriaId);
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
      }

      setIsLoading(cachedProducts.length === 0);
      setError(null);

      const unsubscribe = productService.subscribeToProducts(
        taqueriaId,
        nextProducts => {
          setProducts(nextProducts);
          setError(null);
          setIsLoading(false);
        },
        subscriptionError => {
          setError(subscriptionError.message);
          setIsLoading(false);
        },
      );

      return () => {
        unsubscribe();
        setIsLoading(false);
      };
    }, [taqueriaId]),
  );

  return {
    error,
    isLoading,
    products,
  };
}
