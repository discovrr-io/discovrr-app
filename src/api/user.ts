import Parse from 'parse/react-native';
import { ApiError, CommonApiErrorCode } from './common';

export namespace UserApi {
  export type UserApiErrorCode = CommonApiErrorCode | 'USER_NOT_FOUND';
  export class UserApiError extends ApiError<UserApiErrorCode> {}

  export async function getCurrentUserProfile(): Promise<Parse.Object | null> {
    const $FUNC = '[UserApi.getCurrentUserProfile]';

    const currentUser = await Parse.User.currentAsync();
    if (!currentUser) {
      const message = 'Failed to get current user.';
      console.error($FUNC, message);
      return null;
    }

    const profileQueryForUser = new Parse.Query('Profile');
    const profileQueryForOwner = new Parse.Query('Profile');
    profileQueryForUser.equalTo('user', currentUser);
    profileQueryForOwner.equalTo('owner', currentUser);

    const profile = await Parse.Query.or(
      profileQueryForUser,
      profileQueryForOwner,
    ).first();
    if (!profile) {
      const message = 'Failed to find profile for the current user.';
      console.error($FUNC, message);
      return null;
    }

    return profile;
  }
}
