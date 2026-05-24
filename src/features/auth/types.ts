import {AppUser, ApiTaqueria, UserRole} from '../../shared/types';

export type RegistrationRole = UserRole;

export type RegisterFormValues = {
  address: string;
  city: string;
  email: string;
  confirmPassword: string;
  name: string;
  password: string;
  role: RegistrationRole | null;
  state: string;
  taqueriaName: string;
};

export type RegisterPayload = {
  email: string;
  name: string;
  password: string;
  role: RegistrationRole;
  taqueriaName: string;
};

// ─── API types for NestJS backend ────────────────────────────────────────────

export type ApiTaqueriaMatch = {
  id: string;
  name: string;
  restaurantCode: string;
};

export type ApiRegisterPhase1Result = {
  taqueriaMatches: number;
  canCreateNewTaqueria?: boolean;
  canJoinExistingTaqueria?: boolean;
  requiresTaqueriaInfo?: boolean;
  taquerias?: ApiTaqueriaMatch[];
  message: string;
};

export type ApiAuthResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'WAITER' | 'COOK';
    taqueriaId: string;
  };
  taqueria: ApiTaqueria;
};

export type RegisterAction =
  | {type: 'join'; restaurantCode: string}
  | {type: 'create'};
