import Profile from './profile';

export type UserLocationPreference = {
  searchRadius: number;
  currentLocation: { latitude: number; longitude: number };
};

export type UserSettings = {
  locationPreference: UserLocationPreference;
};

export default interface User {
  provider?: string;
  profile: Profile;
  settings?: UserSettings;
}
