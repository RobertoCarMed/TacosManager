import {UserRole} from '../types';

export const APP_CONFIG = {
  appName: 'TacosManager',
  defaultTaqueriaId: 'demo-taqueria',
  defaultUserName: 'Operador',
  baseApiUrl: 'https://api.example.com',
  tabletBreakpoint: 768,
  roles: ['waiter', 'cook'] as UserRole[],
} as const;
