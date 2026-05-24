import Config from 'react-native-config';

const requiredEnvVars = ['API_URL'];

for (const envVar of requiredEnvVars) {
  if (!Config[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const ENV = {
  apiUrl: Config.API_URL as string,
};
