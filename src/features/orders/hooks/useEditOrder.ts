import {useCallback, useEffect, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../auth';
import {Product} from '../../products/types';
import {Order, OrderType} from '../../../shared/types';
import {ordersService} from '../services/ordersService';

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

let editPlateIdCounter = 0;

function generatePlateId(): string {
  editPlateIdCounter += 1;
  return `plate-edit-${Date.now()}-${editPlateIdCounter}`;
}

function emptyPlate(): NewPlate {
  return {id: generatePlateId(), items: []};
}

export function useEditOrder(orderId: string) {
  const {user} = useAuth();
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [reference, setReference] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [plates, setPlates] = useState<NewPlate[]>([emptyPlate()]);
  const [activePlateId, setActivePlateId] = useState<string>(plates[0]!.id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.taqueriaId || !orderId) {
        setIsLoadingOrder(false);
        return undefined;
      }

      let cancelled = false;

      (async () => {
        setIsLoadingOrder(true);
        setLoadError(null);
        try {
          const order = await ordersService.getOrder(orderId);
          if (cancelled) {
            return;
          }
          if (!order) {
            setLoadError('No se encontro el pedido.');
            setExistingOrder(null);
          } else {
            setExistingOrder(order);
          }
        } catch (loadErr) {
          if (!cancelled) {
            setLoadError(
              loadErr instanceof Error
                ? loadErr.message
                : 'Error al cargar el pedido.',
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingOrder(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [user?.taqueriaId, orderId]),
  );

  // Sync classification state when existing order loads
  useEffect(() => {
    if (existingOrder) {
      setOrderType(existingOrder.type ?? 'DINE_IN');
      setReference(existingOrder.reference ?? '');
      setDeliveryAddress(existingOrder.deliveryAddress ?? '');
    }
  }, [existingOrder]);

  // ── Order type ──────────────────────────────────────────────────────

  const changeOrderType = useCallback((type: OrderType) => {
    setOrderType(type);
    setReference('');
    setDeliveryAddress('');
    setError(null);
  }, []);

  // ── Plate management ────────────────────────────────────────────────

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
          ? {...plate, items: plate.items.filter((_, i) => i !== itemIndex)}
          : plate,
      ),
    );
  }, []);

  const hasNewItems = useMemo(
    () => plates.some(p => p.items.length > 0),
    [plates],
  );

  const isClassificationValid = useMemo(
    () =>
      orderType === 'DELIVERY'
        ? Boolean(deliveryAddress.trim())
        : Boolean(reference.trim()),
    [deliveryAddress, orderType, reference],
  );

  const classificationChanged = useMemo(() => {
    if (!existingOrder) {
      return false;
    }
    return (
      orderType !== existingOrder.type ||
      reference !== (existingOrder.reference ?? '') ||
      deliveryAddress !== (existingOrder.deliveryAddress ?? '')
    );
  }, [existingOrder, orderType, reference, deliveryAddress]);

  const canSave = useMemo(
    () =>
      !isLoadingOrder &&
      existingOrder != null &&
      isClassificationValid &&
      (hasNewItems || classificationChanged) &&
      !isLoading,
    [
      existingOrder,
      hasNewItems,
      isClassificationValid,
      isLoading,
      isLoadingOrder,
      classificationChanged,
    ],
  );

  const saveChanges = useCallback(async () => {
    if (!user?.taqueriaId) {
      setError('No hay una taqueria activa.');
      return false;
    }

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

    const nonEmptyNew = plates.filter(p => p.items.length > 0);

    const existingMaxPlateNumber = existingOrder
      ? Math.max(...existingOrder.plates.map(p => p.plateNumber), 0)
      : 0;

    const classification = classificationChanged
      ? {
          type: orderType,
          reference: reference.trim() || null,
          deliveryAddress: deliveryAddress.trim() || null,
        }
      : undefined;

    try {
      setError(null);
      setIsLoading(true);
      await ordersService.appendPlatesToOrder(
        orderId,
        nonEmptyNew.map((p, i) => ({
          plateNumber: existingMaxPlateNumber + i + 1,
          items: p.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedComplements: item.selectedComplements,
          })),
        })),
        classification,
      );
      return true;
    } catch (saveErr) {
      setError(
        saveErr instanceof Error
          ? saveErr.message
          : 'No se pudieron guardar los cambios.',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.taqueriaId,
    orderType,
    reference,
    deliveryAddress,
    plates,
    existingOrder,
    orderId,
    classificationChanged,
  ]);

  return {
    activePlateId,
    addPlate,
    addProduct,
    canSave,
    changeOrderType,
    classificationChanged,
    decrementQuantity,
    deliveryAddress,
    error,
    existingOrder,
    hasNewItems,
    incrementQuantity,
    isLoading,
    isLoadingOrder,
    loadError,
    orderType,
    plates,
    quantity,
    reference,
    removePlate,
    removeProduct,
    saveChanges,
    selectProduct,
    selectedComplements,
    selectedProduct,
    setActivePlateId,
    setDeliveryAddress,
    setReference,
    toggleComplement,
  };
}
