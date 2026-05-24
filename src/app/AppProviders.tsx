import React, {PropsWithChildren} from 'react';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from '../features/auth';
import {RealtimeProvider} from '../features/realtime';
import {store} from '../store';

export function AppProviders({children}: PropsWithChildren) {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthProvider>
          <RealtimeProvider>{children}</RealtimeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
