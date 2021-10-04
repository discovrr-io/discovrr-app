import Parse from 'parse/react-native';
import { ApiError, CommonApiErrorCode } from './common';

export namespace UserApi {
  export type UserApiErrorCode = CommonApiErrorCode | 'USER_NOT_FOUND';

  export class UserApiError extends ApiError<UserApiErrorCode> {}

  export class UserNotFoundApiError extends UserApiError {
    constructor() {
      super('USER_NOT_FOUND', `Failed to find the current user's profile`);
    }
  }

  export async function getCurrentUserProfile(): Promise<Parse.Object | null> {
    const $FUNC = '[UserApi.getCurrentUserProfile]';

    const currentUser = await Parse.User.currentAsync();
    if (!currentUser) {
      const message = 'Failed to get current user.';
      console.error($FUNC, message);
      return null;
    }

    const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
    profileQuery.equalTo('owner', currentUser);

    const profile = await profileQuery.first();
    if (!profile) {
      const message = 'Failed to find profile for the current user.';
      console.error($FUNC, message);
      return null;
    }

    return profile;
  }
}
