import {useMemo} from 'react';
import {useWindowDimensions} from 'react-native';
import {APP_CONFIG} from '../constants';

export function useResponsive() {
  const {height, width} = useWindowDimensions();

  return useMemo(
    () => ({
      height,
      isTablet: width >= APP_CONFIG.tabletBreakpoint,
      width,
    }),
    [height, width],
  );
}
