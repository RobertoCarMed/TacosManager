import React, {PropsWithChildren, useEffect, useRef} from 'react';
import {useAuth} from '../auth';
import {authService} from '../auth/services/authService';
import {useAppDispatch} from '../../store/hooks';
import {addOrder, setOrders, upsertOrder} from '../orders/store/ordersSlice';
import {ApiOrder, ordersService} from '../orders/services/ordersService';
import {socketService} from '../../services/realtime/socketService';
import {apiClient} from '../../services/api/client';

type OrderEvent = {order: ApiOrder};

export function RealtimeProvider({children}: PropsWithChildren) {
  const {user, signOut} = useAuth();
  const dispatch = useAppDispatch();
  const hasConnectedRef = useRef(false);
  const resyncIdRef = useRef(0);

  useEffect(() => {
    if (!user) {
      hasConnectedRef.current = false;
      socketService.disconnect();
      return;
    }

    const token = authService.getMemoryToken();
    if (!token) {
      return;
    }

    const socket = socketService.connect(token);

    async function resyncOrders(id: number) {
      try {
        const {data} = await apiClient.get<ApiOrder[]>('/orders');
        if (id !== resyncIdRef.current) {
          return;
        }
        const mapped = data.map(order => ordersService.parseOrder(order));
        const active = mapped.filter(
          order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED',
        );
        dispatch(setOrders(active));
      } catch {
        // Silent — realtime events keep the store updated after reconnect
      }
    }

    function onConnect() {
      if (!hasConnectedRef.current) {
        hasConnectedRef.current = true;
        return;
      }
      const id = ++resyncIdRef.current;
      resyncOrders(id);
    }

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

    socket.on('connect', onConnect);
    socket.on('order-created', onOrderCreated);
    socket.on('order-updated', onOrderUpdated);
    socket.on('order-status-changed', onOrderStatusChanged);
    socket.on('disconnect', onDisconnect);

    return () => {
      hasConnectedRef.current = false;
      socket.off('connect', onConnect);
      socket.off('order-created', onOrderCreated);
      socket.off('order-updated', onOrderUpdated);
      socket.off('order-status-changed', onOrderStatusChanged);
      socket.off('disconnect', onDisconnect);
    };
  }, [user, dispatch, signOut]);

  return <>{children}</>;
}
