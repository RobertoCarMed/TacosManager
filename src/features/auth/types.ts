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

// Legacy types — kept for Firestore compatibility during 4.5.x migration
export type CreateTaqueriaParams = {
  city: string;
  name: string;
  normalizedName: string;
  address: string;
  ownerId: string;
  state: string;
};

export type CreateUserProfileParams = {
  id: string;
  name: string;
  email: string;
  role: RegistrationRole;
  taqueriaId: string;
};

export type TaqueriaRecord = {
  address: string;
  city: string;
  createdAt: number;
  id: string;
  name: string;
  normalizedName: string;
  ownerId: string;
  state: string;
};

export type TaqueriaLookupResult = {
  normalizedName: string;
  taqueria: TaqueriaRecord | null;
};

export type RegisteredUserProfile = AppUser & {
  createdAt: number;
  email: string;
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
