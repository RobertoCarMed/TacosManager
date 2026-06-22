import AsyncStorage from '@react-native-async-storage/async-storage';

const PRINTER_CONFIG_KEY = '@tm/printer_config';

export type PrinterConfig = {
  host: string;
  port: number;
};

export const printerStorage = {
  async getConfig(): Promise<PrinterConfig | null> {
    try {
      const raw = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      return raw ? (JSON.parse(raw) as PrinterConfig) : null;
    } catch {
      return null;
    }
  },

  async saveConfig(config: PrinterConfig): Promise<void> {
    await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
  },

  async clearConfig(): Promise<void> {
    await AsyncStorage.removeItem(PRINTER_CONFIG_KEY);
  },
};
