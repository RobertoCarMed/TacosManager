import {UserRole} from '../types';
import {ENV} from '../../config/env';

export const APP_CONFIG = {
  appName: 'TacosManager',
  defaultTaqueriaId: 'demo-taqueria',
  defaultUserName: 'Operador',
  baseApiUrl: ENV.apiUrl,
  socketUrl: ENV.socketUrl,
  environment: ENV.environment,
  tabletBreakpoint: 768,
  roles: ['waiter', 'cook'] as UserRole[],
} as const;
