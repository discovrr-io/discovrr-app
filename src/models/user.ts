import Profile from './profile';
import { LocationQueryPreferences } from './common';

export type UserSettings = {
  locationPreference: LocationQueryPreferences;
};

export default interface User {
  provider?: string;
  profile: Profile;
  settings?: UserSettings;
}
