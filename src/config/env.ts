import Config from 'react-native-config';

const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_APP_ID',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'API_URL',
];

for (const envVar of requiredEnvVars) {
  console.log(envVar, Config);
  if (!Config[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const ENV = {
  apiUrl: Config.API_URL as string,
  firebase: {
    apiKey: Config.FIREBASE_API_KEY as string,
    appId: Config.FIREBASE_APP_ID as string,
    authDomain: Config.FIREBASE_AUTH_DOMAIN as string,
    messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID as string,
    projectId: Config.FIREBASE_PROJECT_ID as string,
    storageBucket: Config.FIREBASE_STORAGE_BUCKET as string,
  },
};
