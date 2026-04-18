import React, {PropsWithChildren} from 'react';
import {ScrollView, StyleSheet, View, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../constants';

type ScreenProps = PropsWithChildren<{
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}>;

export function Screen({children, contentStyle, scrollable}: ScreenProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      {scrollable ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: theme.colors.background,
    flex: 1,
    padding: theme.spacing.md,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
});
