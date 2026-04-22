import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {KitchenScreen} from '../features/kitchen';
import {CreateProductScreen, EditProductScreen} from '../features/products';
import {SettingsScreen} from '../features/settings';
import {theme} from '../shared/constants';
import {KitchenStackParamList} from './types';

const Stack = createNativeStackNavigator<KitchenStackParamList>();

export function KitchenStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.surface},
        headerTintColor: theme.colors.textPrimary,
      }}>
      <Stack.Screen
        name="KitchenDashboard"
        component={KitchenScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CreateProduct"
        component={CreateProductScreen}
        options={{title: 'Nuevo producto'}}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{title: 'Editar producto'}}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Configuracion'}}
      />
    </Stack.Navigator>
  );
}
