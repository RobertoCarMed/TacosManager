import React, {PropsWithChildren} from 'react';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from '../features/auth';
import {store} from '../store';

export function AppProviders({children}: PropsWithChildren) {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthProvider>{children}</AuthProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
