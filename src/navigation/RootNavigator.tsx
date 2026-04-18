import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useAuth} from '../features/auth';
import {theme} from '../shared/constants';
import {AuthStack} from './AuthStack';
import {KitchenStack} from './KitchenStack';
import {WaiterStack} from './WaiterStack';

export function RootNavigator() {
  const {isLoading, user} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Conectando con TacosManager...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }

  return user.role === 'cook' ? <KitchenStack /> : <WaiterStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});
