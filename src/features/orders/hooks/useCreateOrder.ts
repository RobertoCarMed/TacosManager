import {useCallback, useMemo, useState} from 'react';
import {useAuth} from '../../auth';
import {ordersService} from '../services/ordersService';
import {Product} from '../../products/types';

type NewOrderItem = {
  name: string;
  quantity: number;
};

export function useCreateOrder() {
  const [table, setTable] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [items, setItems] = useState<NewOrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useAuth();

  const incrementQuantity = useCallback(() => {
    setQuantity(current => current + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(current => (current > 0 ? current - 1 : 0));
  }, []);

  const selectProduct = useCallback((product: Product | null) => {
    setSelectedProduct(product);
    setQuantity(product ? 1 : 0);
    setError(null);
  }, []);

  const addProduct = useCallback(() => {
    if (!selectedProduct) {
      setError('Selecciona un producto.');
      return false;
    }

    if (quantity < 1) {
      setError('La cantidad debe ser mayor a 0.');
      return false;
    }

    setError(null);
    setItems(current => [
      ...current,
      {
        name: selectedProduct.name,
        quantity,
      },
    ]);
    setSelectedProduct(null);
    setQuantity(0);
    return true;
  }, [quantity, selectedProduct]);

  const removeProduct = useCallback((index: number) => {
    setItems(current => current.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const saveOrder = useCallback(async () => {
    if (!table.trim()) {
      setError('Mesa o cliente es obligatorio.');
      return false;
    }

    if (items.length === 0) {
      setError('Agrega al menos un producto.');
      return false;
    }

    if (!user?.taqueriaId) {
      setError('No hay una taqueria activa.');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);

      await ordersService.createOrder(user.taqueriaId, {
        items,
        table: table.trim(),
      });

      setTable('');
      setItems([]);
      setSelectedProduct(null);
      setQuantity(0);

      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'No se pudo guardar el pedido.',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [items, table, user?.taqueriaId]);

  const canSave = useMemo(
    () => Boolean(table.trim()) && items.length > 0 && !isLoading,
    [isLoading, items.length, table],
  );

  return {
    addProduct,
    canSave,
    decrementQuantity,
    error,
    incrementQuantity,
    isLoading,
    items,
    selectedProduct,
    quantity,
    removeProduct,
    saveOrder,
    selectProduct,
    setTable,
    table,
  };
}
