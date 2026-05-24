import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import { ordersService } from '../services/ordersService';
import { Product } from '../../products/types';
import { OrderType } from '../../../shared/types';

type NewOrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedComplements: string[];
  availableComplements: string[];
  complements: string[];
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
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [reference, setReference] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [plates, setPlates] = useState<NewPlate[]>([
    { id: generatePlateId(), items: [] },
  ]);
  const [activePlateId, setActivePlateId] = useState<string>(plates[0].id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // ── Order type ──────────────────────────────────────────────────────

  const changeOrderType = useCallback((type: OrderType) => {
    setOrderType(type);
    setReference('');
    setDeliveryAddress('');
    setError(null);
  }, []);

  // ── Plate management ────────────────────────────────────────────────

  const addPlate = useCallback(() => {
    const newPlate: NewPlate = { id: generatePlateId(), items: [] };
    setPlates(current => [...current, newPlate]);
    setActivePlateId(newPlate.id);
    setError(null);
  }, []);

  const removePlate = useCallback(
    (plateId: string) => {
      setPlates(current => {
        const next = current.filter(p => p.id !== plateId);
        if (next.length === 0) {
          const fallback: NewPlate = { id: generatePlateId(), items: [] };
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

  // ── Product selection ───────────────────────────────────────────────

  const incrementQuantity = useCallback(() => {
    setQuantity(current => current + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(current => (current > 0 ? current - 1 : 0));
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
        ? current.filter(item => item !== complement)
        : [...current, complement],
    );
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
                {
                  productId: selectedProduct.id,
                  name: selectedProduct.name,
                  price: selectedProduct.price,
                  quantity,
                  selectedComplements,
                  availableComplements: selectedProduct.complements.slice(0, 3),
                  complements: selectedComplements,
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

  // ── Save ────────────────────────────────────────────────────────────

  const saveOrder = useCallback(async () => {
    if (orderType !== 'DELIVERY' && !reference.trim()) {
      setError(
        orderType === 'DINE_IN'
          ? 'La referencia (mesa) es obligatoria.'
          : 'El nombre de quien recoge es obligatorio.',
      );
      return false;
    }

    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      setError('La dirección de entrega es obligatoria.');
      return false;
    }

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

      await ordersService.createOrder({
        type: orderType,
        reference: reference.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        plates: nonEmptyPlates.map((p, i) => ({
          plateNumber: i + 1,
          items: p.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedComplements: item.selectedComplements,
          })),
        })),
      });

      const freshPlate: NewPlate = { id: generatePlateId(), items: [] };
      setOrderType('DINE_IN');
      setReference('');
      setDeliveryAddress('');
      setPlates([freshPlate]);
      setActivePlateId(freshPlate.id);
      setSelectedProduct(null);
      setSelectedComplements([]);
      setQuantity(0);

      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo guardar el pedido.',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deliveryAddress, orderType, plates, reference, user?.taqueriaId]);

  const isClassificationValid = useMemo(
    () =>
      orderType === 'DELIVERY'
        ? Boolean(deliveryAddress.trim())
        : Boolean(reference.trim()),
    [deliveryAddress, orderType, reference],
  );

  const canSave = useMemo(
    () =>
      isClassificationValid &&
      plates.some(p => p.items.length > 0) &&
      !isLoading,
    [isClassificationValid, isLoading, plates],
  );

  return {
    activePlateId,
    addPlate,
    addProduct,
    canSave,
    changeOrderType,
    decrementQuantity,
    deliveryAddress,
    error,
    incrementQuantity,
    isLoading,
    orderType,
    plates,
    quantity,
    reference,
    removePlate,
    removeProduct,
    saveOrder,
    selectProduct,
    selectedComplements,
    selectedProduct,
    setActivePlateId,
    setDeliveryAddress,
    setReference,
    toggleComplement,
  };
}
