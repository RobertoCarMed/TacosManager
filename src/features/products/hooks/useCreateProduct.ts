import {useCallback, useMemo, useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../../auth';
import {productService} from '../services/productService';

function isValidPrice(value: string) {
  const parsedPrice = Number(value);
  return Number.isFinite(parsedPrice) && parsedPrice > 0;
}

export function useCreateProduct() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {user} = useAuth();

  const pickImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        return;
      }

      const selectedAsset = result.assets?.[0];

      if (!selectedAsset?.uri) {
        setError('No se pudo obtener la imagen seleccionada.');
        return;
      }

      setError(null);
      setImageUri(selectedAsset.uri);
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : 'No se pudo abrir la galeria.');
    }
  }, []);

  const removeImage = useCallback(() => {
    setImageUri(undefined);
  }, []);

  const saveProduct = useCallback(async () => {
    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return false;
    }

    if (!price.trim()) {
      setError('El precio del producto es obligatorio.');
      return false;
    }

    if (!isValidPrice(price)) {
      setError('El precio debe ser un numero mayor a 0.');
      return false;
    }

    if (!user?.taqueriaId) {
      setError('No hay una taqueria activa.');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);

      await productService.createProduct({
        ...(imageUri ? {imageUri} : {}),
        name: name.trim(),
        price: Number(price),
        taqueriaId: user.taqueriaId,
      });

      setName('');
      setPrice('');
      setImageUri(undefined);
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el producto.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, name, price, user?.taqueriaId]);

  const canSave = useMemo(
    () => Boolean(name.trim()) && isValidPrice(price) && !isLoading,
    [isLoading, name, price],
  );

  return {
    canSave,
    error,
    imageUri,
    isLoading,
    name,
    pickImage,
    price,
    removeImage,
    saveProduct,
    setName,
    setPrice,
  };
}
