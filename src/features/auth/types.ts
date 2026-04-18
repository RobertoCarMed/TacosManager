import {AppUser, UserRole} from '../../shared/types';

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
