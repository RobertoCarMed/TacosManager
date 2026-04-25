import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  CreateOrderScreen,
  EditOrderScreen,
  WaiterOrdersScreen,
} from '../features/orders';
import {theme} from '../shared/constants';
import {WaiterStackParamList} from './types';

const Stack = createNativeStackNavigator<WaiterStackParamList>();

export function WaiterStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.surface},
        headerTintColor: theme.colors.textPrimary,
      }}>
      <Stack.Screen name="WaiterOrders" component={WaiterOrdersScreen} options={{title: 'Pedidos'}} />
      <Stack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{title: 'Crear pedido'}}
      />
      <Stack.Screen
        name="EditOrder"
        component={EditOrderScreen}
        options={{title: 'Editar pedido'}}
      />
    </Stack.Navigator>
  );
}
