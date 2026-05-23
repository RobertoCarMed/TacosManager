import {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
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
  subscribe?: boolean;
};

export function useOrders(options?: UseOrdersOptions) {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const isLoading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const {user} = useAuth();
  const dateFilter = options?.dateFilter ?? 'today';
  const createdBy = options?.createdBy;
  const shouldSubscribe = options?.subscribe ?? true;

  useFocusEffect(
    useCallback(() => {
      if (!shouldSubscribe) {
        return undefined;
      }

      if (!user?.taqueriaId) {
        dispatch(resetOrdersState());
        return undefined;
      }

      dispatch(setOrdersLoading(true));

      const unsubscribe = ordersService.subscribeToOrders(
        {dateFilter, taqueriaId: user.taqueriaId},
        nextOrders => {
          dispatch(setOrders(nextOrders));
        },
        subscriptionError => {
          dispatch(setOrdersError(subscriptionError.message));
        },
      );

      return () => {
        unsubscribe();
        dispatch(setOrdersLoading(false));
      };
    }, [createdBy, dateFilter, dispatch, shouldSubscribe, user?.taqueriaId]),
  );

  const createOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      if (!user?.taqueriaId) {
        throw new Error('No hay una taqueria activa.');
      }

      dispatch(setOrdersLoading(true));

      try {
        await ordersService.createOrder(payload);
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
    [dispatch, user?.taqueriaId],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (!user?.taqueriaId) {
        throw new Error('No hay una taqueria activa.');
      }

      try {
        await ordersService.updateOrderStatus(orderId, status);
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
