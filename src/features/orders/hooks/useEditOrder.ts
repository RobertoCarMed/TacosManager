import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import { Product } from '../../products/types';
import { Order, Plate } from '../../../shared/types';
import { ordersService } from '../services/ordersService';

type NewOrderItem = {
  availableComplements: string[];
  complements: string[];
  id?: string;
  name: string;
  price: number;
  quantity: number;
};

type NewPlate = {
  id: string;
  items: NewOrderItem[];
};

let editPlateIdCounter = 0;

function generatePlateId(): string {
  editPlateIdCounter += 1;
  return `plate-edit-${Date.now()}-${editPlateIdCounter}`;
}

function emptyPlate(): NewPlate {
  return { id: generatePlateId(), items: [] };
}

export function useEditOrder(orderId: string) {
  const { user } = useAuth();
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  const [plates, setPlates] = useState<NewPlate[]>([emptyPlate()]);
  const [activePlateId, setActivePlateId] = useState<string>(plates[0]!.id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('useEffect', user?.taqueriaId, orderId);
    if (!user?.taqueriaId || !orderId) {
      setIsLoadingOrder(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoadingOrder(true);
      console.log("entra a getOrder")
      setLoadError(null);
      try {
        console.log("entra a getOrder 3")
        const order = await ordersService.getOrder(user.taqueriaId, orderId);
        console.log("order", order);
        if (cancelled) {
          return;
        }
        if (!order) {
          setLoadError('No se encontró el pedido.');
          setExistingOrder(null);
        } else {
          setExistingOrder(order);
        }
      } catch (loadErr) {
        console.log("catch getOrder", loadErr);
        if (!cancelled) {
          setLoadError(
            loadErr instanceof Error
              ? loadErr.message
              : 'Error al cargar el pedido.',
          );
        }
      } finally {
        console.log("finally getOrder")
        if (!cancelled) {
          setIsLoadingOrder(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.taqueriaId, orderId]);

  const addPlate = useCallback(() => {
    const newPlate: NewPlate = emptyPlate();
    setPlates(current => [...current, newPlate]);
    setActivePlateId(newPlate.id);
    setError(null);
  }, []);

  const removePlate = useCallback(
    (plateId: string) => {
      setPlates(current => {
        const next = current.filter(p => p.id !== plateId);
        if (next.length === 0) {
          const fallback = emptyPlate();
          setActivePlateId(fallback.id);
          return [fallback];
        }
        if (plateId === activePlateId) {
          setActivePlateId(next[0].id);
        }
        return next;
      });
      setError(null);
    },
    [activePlateId],
  );

  const incrementQuantity = useCallback(() => {
    setQuantity(c => c + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(c => (c > 0 ? c - 1 : 0));
  }, []);

  const selectProduct = useCallback((product: Product | null) => {
    setSelectedProduct(product);
    setSelectedComplements([]);
    setQuantity(product ? 1 : 0);
    setError(null);
  }, []);

  const toggleComplement = useCallback((complement: string) => {
    setSelectedComplements(current =>
      current.includes(complement)
        ? current.filter(c => c !== complement)
        : [...current, complement],
    );
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
    setPlates(current =>
      current.map(plate =>
        plate.id === activePlateId
          ? {
              ...plate,
              items: [
                ...plate.items,
                {
                  availableComplements: selectedProduct.complements.slice(0, 3),
                  complements: selectedComplements,
                  id: selectedProduct.id,
                  name: selectedProduct.name,
                  price: selectedProduct.price,
                  quantity,
                },
              ],
            }
          : plate,
      ),
    );
    setSelectedProduct(null);
    setSelectedComplements([]);
    setQuantity(0);
    return true;
  }, [activePlateId, quantity, selectedComplements, selectedProduct]);

  const removeProduct = useCallback((plateId: string, itemIndex: number) => {
    setPlates(current =>
      current.map(plate =>
        plate.id === plateId
          ? { ...plate, items: plate.items.filter((_, i) => i !== itemIndex) }
          : plate,
      ),
    );
  }, []);

  const hasNewItems = useMemo(
    () => plates.some(p => p.items.length > 0),
    [plates],
  );

  const canSave = useMemo(
    () => hasNewItems && !isLoadingOrder && existingOrder != null,
    [existingOrder, hasNewItems, isLoadingOrder],
  );

  const saveChanges = useCallback(async () => {
    if (!user?.taqueriaId) {
      setError('No hay una taqueria activa.');
      return false;
    }
    const nonEmptyNew: Plate[] = plates
      .filter(p => p.items.length > 0)
      .map(p => ({ id: p.id, items: p.items }));

    if (nonEmptyNew.length === 0) {
      setError('Agrega al menos un producto.');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);
      const latest = await ordersService.getOrder(user.taqueriaId, orderId);
      if (!latest) {
        setError('No se encontró el pedido.');
        return false;
      }
      await ordersService.appendPlatesToOrder(
        user.taqueriaId,
        orderId,
        latest,
        nonEmptyNew,
      );
      return true;
    } catch (saveErr) {
      setError(
        saveErr instanceof Error
          ? saveErr.message
          : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.taqueriaId, orderId, plates]);

  return {
    activePlateId,
    addPlate,
    addProduct,
    canSave,
    decrementQuantity,
    error,
    existingOrder,
    hasNewItems,
    incrementQuantity,
    isLoading,
    isLoadingOrder,
    loadError,
    plates,
    quantity,
    removePlate,
    removeProduct,
    saveChanges,
    selectProduct,
    selectedComplements,
    selectedProduct,
    setActivePlateId,
    toggleComplement,
  };
}
