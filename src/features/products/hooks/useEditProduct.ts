import {useEffect, useMemo, useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../../auth';
import {productService} from '../services/productService';
import {Product} from '../types';
import {useProducts} from './useProducts';

export function useEditProduct() {
  const {user} = useAuth();
  const taqueriaId = user?.taqueriaId;

  const {
    error: productsError,
    isLoading: isLoadingProducts,
    products,
  } = useProducts(taqueriaId);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId) || null,
    [products, selectedProductId],
  );

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      setName(selectedProduct.name);
      setPrice(String(selectedProduct.price));
      setNewImageUri(undefined);
      setError(null);
    } else {
      setName('');
      setPrice('');
      setNewImageUri(undefined);
      setError(null);
    }
  }, [selectedProduct]);

  const canSave = useMemo(() => {
    const parsedPrice = parseFloat(price);
    return Boolean(
      selectedProductId &&
        name.trim().length > 0 &&
        !isNaN(parsedPrice) &&
        parsedPrice > 0,
    );
  }, [name, price, selectedProductId]);

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0].uri) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch {
      setError('Error al seleccionar la imagen.');
    }
  };

  const saveProduct = async (): Promise<boolean> => {
    if (!taqueriaId || !selectedProduct) {
      setError('No hay un producto seleccionado o taqueria activa.');
      return false;
    }

    if (!canSave) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      await productService.updateProduct({
        existingImageUrl: selectedProduct.imageUrl,
        name: name.trim(),
        newImageUri,
        price: parseFloat(price),
        productId: selectedProduct.id,
        taqueriaId,
      });

      setNewImageUri(undefined);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al actualizar el producto.',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    canSave,
    error,
    isLoading,
    isLoadingProducts,
    name,
    newImageUri,
    pickImage,
    price,
    products,
    productsError,
    saveProduct,
    selectedProduct,
    selectedProductId,
    setName,
    setNewImageUri,
    setPrice,
    setSelectedProductId,
  };
}
