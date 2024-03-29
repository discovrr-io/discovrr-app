import { AppearancePreferences, LocationQueryPreferences } from './common';

export default interface AppSettings {
  readonly locationQueryPrefs?: LocationQueryPreferences;
  // readonly notificationPrefs?: NotificationPreferences;
  readonly appearancePrefs: AppearancePreferences;
}
