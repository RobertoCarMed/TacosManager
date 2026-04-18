import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'react-native';
import {RootNavigator} from '../navigation';
import {theme} from '../shared/constants';
import {AppProviders} from './AppProviders';

export function AppRoot() {
  return (
    <AppProviders>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle="dark-content"
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
}
