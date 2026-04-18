import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LoginScreen, RegisterScreen} from '../features/auth';
import {theme} from '../shared/constants';
import {AuthStackParamList} from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: {backgroundColor: theme.colors.background},
        headerShadowVisible: false,
        headerStyle: {backgroundColor: theme.colors.background},
        headerTintColor: theme.colors.textPrimary,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{title: 'Crear cuenta'}} />
    </Stack.Navigator>
  );
}
