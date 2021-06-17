import Profile from './profile';

export type UserSettings = {
  locationRadius?: number;
};

export default interface User {
  profile: Profile;
  settings: UserSettings;
}
