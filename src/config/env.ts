import Config from 'react-native-config';

const requiredEnvVars = ['API_URL', 'SOCKET_URL', 'ENVIRONMENT'];

for (const envVar of requiredEnvVars) {
  if (!Config[envVar]) {
    throw new Error(
      `[TacosManager] Missing required environment variable: ${envVar}\n` +
        'Configure your .env file or run with ENVFILE=.env.<environment>',
    );
  }
}

export const ENV = {
  apiUrl: Config.API_URL as string,
  socketUrl: Config.SOCKET_URL as string,
  environment: Config.ENVIRONMENT as string,
};
