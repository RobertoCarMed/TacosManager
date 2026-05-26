import React, {PropsWithChildren, useEffect} from 'react';
import {useAuth} from '../auth';
import {authService} from '../auth/services/authService';
import {useAppDispatch} from '../../store/hooks';
import {addOrder, upsertOrder} from '../orders/store/ordersSlice';
import {ApiOrder, ordersService} from '../orders/services/ordersService';
import {socketService} from '../../services/realtime/socketService';

type OrderEvent = {order: ApiOrder};

export function RealtimeProvider({children}: PropsWithChildren) {
  const {user, signOut} = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      return;
    }

    const token = authService.getMemoryToken();
    if (!token) {
      return;
    }

    const socket = socketService.connect(token);

    function onOrderCreated({order}: OrderEvent) {
      dispatch(addOrder(ordersService.parseOrder(order)));
    }

    function onOrderUpdated({order}: OrderEvent) {
      dispatch(upsertOrder(ordersService.parseOrder(order)));
    }

    function onOrderStatusChanged({order}: OrderEvent) {
      dispatch(upsertOrder(ordersService.parseOrder(order)));
    }

    function onDisconnect(reason: string) {
      if (reason === 'io server disconnect') {
        signOut();
      }
    }

    socket.on('order-created', onOrderCreated);
    socket.on('order-updated', onOrderUpdated);
    socket.on('order-status-changed', onOrderStatusChanged);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('order-created', onOrderCreated);
      socket.off('order-updated', onOrderUpdated);
      socket.off('order-status-changed', onOrderStatusChanged);
      socket.off('disconnect', onDisconnect);
    };
  }, [user, dispatch, signOut]);

  return <>{children}</>;
}
