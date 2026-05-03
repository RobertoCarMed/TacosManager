import {useCallback, useEffect} from 'react';
import {CreateOrderPayload, OrderStatus} from '../../../shared/types';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {useAuth} from '../../auth';
import {OrderDateFilter, ordersService} from '../services/ordersService';
import {
  resetOrdersState,
  selectOrders,
  selectOrdersError,
  selectOrdersLoading,
  setOrders,
  setOrdersError,
  setOrdersLoading,
} from '../store/ordersSlice';

type UseOrdersOptions = {
  createdBy?: string;
  dateFilter?: OrderDateFilter;
};

export function useOrders(options?: UseOrdersOptions) {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const isLoading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const {user} = useAuth();
  const dateFilter = options?.dateFilter ?? 'today';
  const createdBy = options?.createdBy;

  useEffect(() => {
    if (!user?.taqueriaId) {
      dispatch(resetOrdersState());
      return;
    }

    dispatch(setOrdersLoading(true));

    // Components consume normalized state from Redux while Firestore sync stays encapsulated here.
    const unsubscribe = ordersService.subscribeToOrders(
      user.taqueriaId,
      {
        createdBy,
        dateFilter,
      },
      nextOrders => {
        dispatch(setOrders(nextOrders));
      },
      subscriptionError => {
        dispatch(setOrdersError(subscriptionError.message));
      },
    );

    return unsubscribe;
  }, [createdBy, dateFilter, dispatch, user?.taqueriaId]);

  const createOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      if (!user?.taqueriaId) {
        throw new Error('No hay una taqueria activa.');
      }

      dispatch(setOrdersLoading(true));

      try {
        await ordersService.createOrder(user.taqueriaId, payload, user.id);
      } catch (createOrderError) {
        dispatch(
          setOrdersError(
            createOrderError instanceof Error
              ? createOrderError.message
              : 'No se pudo crear el pedido.',
          ),
        );
        throw createOrderError;
      } finally {
        dispatch(setOrdersLoading(false));
      }
    },
    [dispatch, user?.id, user?.taqueriaId],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (!user?.taqueriaId) {
        throw new Error('No hay una taqueria activa.');
      }

      try {
        await ordersService.updateOrderStatus(user.taqueriaId, orderId, status);
      } catch (updateOrderError) {
        dispatch(
          setOrdersError(
            updateOrderError instanceof Error
              ? updateOrderError.message
              : 'No se pudo actualizar el pedido.',
          ),
        );
        throw updateOrderError;
      }
    },
    [dispatch, user?.taqueriaId],
  );

  return {
    createOrder,
    error,
    isLoading,
    orders,
    updateOrderStatus,
  };
}
