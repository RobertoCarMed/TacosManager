import {AppUser, ApiTaqueria, UserRole} from '../../../shared/types';
import {apiClient} from '../../../services/api/client';
import {tokenStorage} from '../../../services/storage/tokenStorage';
import {
  ApiAuthResponse,
  ApiRegisterPhase1Result,
  RegisterFormValues,
} from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRole(apiRole: 'WAITER' | 'COOK'): UserRole {
  return apiRole.toLowerCase() as UserRole;
}

function mapApiUser(raw: ApiAuthResponse['user']): AppUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: mapRole(raw.role),
    taqueriaId: raw.taqueriaId,
  };
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }
  const axiosError = error as {response?: {data?: {message?: string | string[]}}};
  const data = axiosError.response?.data;
  if (!data) {
    return fallback;
  }
  if (Array.isArray(data.message)) {
    return data.message[0] ?? fallback;
  }
  return typeof data.message === 'string' ? data.message : fallback;
}

// ─── In-memory token cache ────────────────────────────────────────────────────

let memoryToken: string | null = null;

function applyToken(token: string) {
  memoryToken = token;
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function clearToken() {
  memoryToken = null;
  delete apiClient.defaults.headers.common['Authorization'];
}

// ─── Auth service ─────────────────────────────────────────────────────────────

export const authService = {
  getMemoryToken(): string | null {
    return memoryToken;
  },

  async login(
    email: string,
    password: string,
  ): Promise<{user: AppUser; taqueria: ApiTaqueria}> {
    try {
      const response = await apiClient.post<ApiAuthResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const {accessToken, user: rawUser, taqueria} = response.data;
      const user = mapApiUser(rawUser);

      applyToken(accessToken);
      await tokenStorage.setToken(accessToken);

      return {user, taqueria};
    } catch (error) {
      const statusCode = (error as {response?: {status?: number}}).response?.status;
      if (statusCode === 401) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      throw new Error(
        extractApiErrorMessage(error, 'No se pudo iniciar sesión.'),
      );
    }
  },

  async registerDiscoverTaqueria(
    values: RegisterFormValues,
  ): Promise<ApiRegisterPhase1Result> {
    try {
      const response = await apiClient.post<ApiRegisterPhase1Result>(
        '/auth/register',
        {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          role: values.role?.toUpperCase(),
          taqueriaName: values.taqueriaName.trim(),
        },
      );
      return response.data;
    } catch (error) {
      const statusCode = (error as {response?: {status?: number}}).response?.status;
      if (statusCode === 409) {
        throw new Error('Este correo ya está registrado.');
      }
      throw new Error(
        extractApiErrorMessage(error, 'No se pudo validar la taquería.'),
      );
    }
  },

  async registerJoinTaqueria(
    values: RegisterFormValues,
    selectedRestaurantCode: string,
  ): Promise<{user: AppUser; taqueria: ApiTaqueria}> {
    try {
      const response = await apiClient.post<ApiAuthResponse>('/auth/register', {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role?.toUpperCase(),
        taqueriaName: values.taqueriaName.trim(),
        confirmJoinExistingTaqueria: true,
        selectedRestaurantCode,
      });

      const {accessToken, user: rawUser, taqueria} = response.data;
      const user = mapApiUser(rawUser);

      applyToken(accessToken);
      await tokenStorage.setToken(accessToken);

      return {user, taqueria};
    } catch (error) {
      const statusCode = (error as {response?: {status?: number}}).response?.status;
      if (statusCode === 409) {
        throw new Error('Este correo ya está registrado.');
      }
      throw new Error(
        extractApiErrorMessage(error, 'No se pudo completar el registro.'),
      );
    }
  },

  async registerCreateTaqueria(
    values: RegisterFormValues,
  ): Promise<{user: AppUser; taqueria: ApiTaqueria}> {
    try {
      const taqueriaData: Record<string, string> = {};
      if (values.address.trim()) {
        taqueriaData.address = values.address.trim();
      }
      if (values.city.trim()) {
        taqueriaData.city = values.city.trim();
      }
      if (values.state.trim()) {
        taqueriaData.state = values.state.trim();
      }

      const response = await apiClient.post<ApiAuthResponse>('/auth/register', {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role?.toUpperCase(),
        taqueriaName: values.taqueriaName.trim(),
        createNewTaqueria: true,
        taqueriaData,
      });

      const {accessToken, user: rawUser, taqueria} = response.data;
      const user = mapApiUser(rawUser);

      applyToken(accessToken);
      await tokenStorage.setToken(accessToken);

      return {user, taqueria};
    } catch (error) {
      const statusCode = (error as {response?: {status?: number}}).response?.status;
      if (statusCode === 409) {
        throw new Error('Este correo ya está registrado.');
      }
      throw new Error(
        extractApiErrorMessage(error, 'No se pudo crear la taquería.'),
      );
    }
  },

  async signOut(): Promise<void> {
    clearToken();
    await tokenStorage.removeToken();
  },

  async restoreSession(): Promise<{user: AppUser; taqueria: ApiTaqueria} | null> {
    const storedToken = await tokenStorage.getToken();
    if (!storedToken) {
      return null;
    }

    try {
      applyToken(storedToken);

      const response = await apiClient.get<{
        id: string;
        name: string;
        email: string;
        role: 'WAITER' | 'COOK';
        taqueriaId: string;
        taqueria: ApiTaqueria;
      }>('/auth/me');

      const {taqueria, ...rawUser} = response.data;
      const user = mapApiUser(rawUser);

      return {user, taqueria};
    } catch {
      clearToken();
      await tokenStorage.removeToken();
      return null;
    }
  },
};
