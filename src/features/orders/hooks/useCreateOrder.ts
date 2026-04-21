import {useCallback, useMemo, useState} from 'react';
import {useAuth} from '../../auth';
import {ordersService} from '../services/ordersService';
import {Product} from '../../products/types';

type NewOrderItem = {
  name: string;
  quantity: number;
};

type NewPlate = {
  id: string;
  items: NewOrderItem[];
};

let plateIdCounter = 0;

function generatePlateId(): string {
  plateIdCounter += 1;
  return `plate-${Date.now()}-${plateIdCounter}`;
}

export function useCreateOrder() {
  const [table, setTable] = useState('');
  const [plates, setPlates] = useState<NewPlate[]>([
    {id: generatePlateId(), items: []},
  ]);
  const [activePlateId, setActivePlateId] = useState<string>(plates[0].id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useAuth();

  // ── Plate management ────────────────────────────────────────────────

  const addPlate = useCallback(() => {
    const newPlate: NewPlate = {id: generatePlateId(), items: []};
    setPlates(current => [...current, newPlate]);
    setActivePlateId(newPlate.id);
    setError(null);
  }, []);

  const removePlate = useCallback(
    (plateId: string) => {
      setPlates(current => {
        const next = current.filter(p => p.id !== plateId);
        // Always keep at least one plate
        if (next.length === 0) {
          const fallback: NewPlate = {id: generatePlateId(), items: []};
          setActivePlateId(fallback.id);
          return [fallback];
        }
        // If the removed plate was the active one, move focus
        if (plateId === activePlateId) {
          setActivePlateId(next[0].id);
        }
        return next;
      });
      setError(null);
    },
    [activePlateId],
  );

  // ── Product selection ───────────────────────────────────────────────

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

  // ── Add / Remove items inside a plate ───────────────────────────────

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
                {name: selectedProduct.name, quantity},
              ],
            }
          : plate,
      ),
    );
    setSelectedProduct(null);
    setQuantity(0);
    return true;
  }, [activePlateId, quantity, selectedProduct]);

  const removeProduct = useCallback(
    (plateId: string, itemIndex: number) => {
      setPlates(current =>
        current.map(plate =>
          plate.id === plateId
            ? {...plate, items: plate.items.filter((_, i) => i !== itemIndex)}
            : plate,
        ),
      );
    },
    [],
  );

  // ── Save ────────────────────────────────────────────────────────────

  const saveOrder = useCallback(async () => {
    if (!table.trim()) {
      setError('Mesa o cliente es obligatorio.');
      return false;
    }

    // Validate: at least one plate with at least one item
    const nonEmptyPlates = plates.filter(p => p.items.length > 0);
    if (nonEmptyPlates.length === 0) {
      setError('Agrega al menos un plato con productos.');
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
        plates: nonEmptyPlates,
        table: table.trim(),
      });

      // Reset state
      const freshPlate: NewPlate = {id: generatePlateId(), items: []};
      setTable('');
      setPlates([freshPlate]);
      setActivePlateId(freshPlate.id);
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
  }, [plates, table, user?.taqueriaId]);

  const canSave = useMemo(
    () =>
      Boolean(table.trim()) &&
      plates.some(p => p.items.length > 0) &&
      !isLoading,
    [isLoading, plates, table],
  );

  return {
    activePlateId,
    addPlate,
    addProduct,
    canSave,
    decrementQuantity,
    error,
    incrementQuantity,
    isLoading,
    plates,
    quantity,
    removePlate,
    removeProduct,
    saveOrder,
    selectProduct,
    selectedProduct,
    setActivePlateId,
    setTable,
    table,
  };
}
