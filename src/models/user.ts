import Profile from './profile';
// import { LocationQueryPreferences } from './common';

// export type UserSettings = {
//   locationPreference: LocationQueryPreferences;
// };

export default interface User {
  provider?: string;
  // TODO: Refactor this to just the profile ID
  profile: Profile;
}
