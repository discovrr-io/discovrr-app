import { EntityId } from '@reduxjs/toolkit';
import { ProfileId } from './profile';

export type UserId = EntityId & { __userIdBrand: any };

export default interface User {
  /**
   * The ID of the current user.
   *
   * This ID will be the same as getting the current user's ID via Parse.
   */
  readonly id: UserId;
  /**
   * The authentication provider of the user for internal purposes.
   */
  readonly provider?: string;
  /**
   * The profile ID associated with this user's account.
   */
  readonly profileId: ProfileId;
}
