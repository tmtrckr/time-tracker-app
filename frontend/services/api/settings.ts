import { Settings } from '../../types';
import { invoke } from './utils';

export const settingsApi = {
  getSettings: (): Promise<Settings> => {
    return invoke('get_settings');
  },
  
  updateSettings: (settings: Partial<Settings>): Promise<Settings> => {
    return invoke('update_settings', { settings });
  },
  
  enableAutostart: (): Promise<void> => {
    return invoke('enable_autostart');
  },
  
  disableAutostart: (): Promise<void> => {
    return invoke('disable_autostart');
  },
  
  isAutostartEnabled: (): Promise<boolean> => {
    return invoke('is_autostart_enabled');
  },
};
