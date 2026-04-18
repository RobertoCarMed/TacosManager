import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Order} from '../../../shared/types';
import type {RootState} from '../../../store';

type OrdersState = {
  error: string | null;
  isLoading: boolean;
  items: Order[];
};

const initialState: OrdersState = {
  error: null,
  isLoading: false,
  items: [],
};

const ordersSlice = createSlice({
  initialState,
  name: 'orders',
  reducers: {
    resetOrdersState: () => initialState,
    setOrders(state, action: PayloadAction<Order[]>) {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setOrdersError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    setOrdersLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const {resetOrdersState, setOrders, setOrdersError, setOrdersLoading} =
  ordersSlice.actions;

export const ordersReducer = ordersSlice.reducer;

export const selectOrders = (state: RootState) => state.orders.items;
export const selectOrdersError = (state: RootState) => state.orders.error;
export const selectOrdersLoading = (state: RootState) => state.orders.isLoading;
