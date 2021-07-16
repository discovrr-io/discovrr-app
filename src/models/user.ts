import { ProfileId } from './profile';

export default interface User {
  /**
   * The ID of the current user.
   *
   * This ID will be the same as getting the current user's ID via Parse.
   */
  id: string;
  /**
   * The authentication provider of the user for internal purposes.
   */
  provider?: string;
  /**
   * The profile ID associated with this user's account.
   */
  profileId: ProfileId;
}
