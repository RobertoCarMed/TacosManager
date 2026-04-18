import axios from 'axios';
import {APP_CONFIG} from '../../shared/constants';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.baseApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
