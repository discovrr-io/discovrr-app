import Parse from 'parse/react-native';
import { ApiError, CommonApiErrorCode } from './common';

export namespace UserApi {
  export type UserApiErrorCode = CommonApiErrorCode | 'USER_NOT_FOUND';
  export class UserApiError extends ApiError<UserApiErrorCode> {}

  export async function getCurrentUserProfile(): Promise<Parse.Object | null> {
    const $FUNC = '[UserApi.getCurrentUserProfile]';

    const currentUser = await Parse.User.currentAsync();
    if (!currentUser) {
      // console.warn($FUNC, 'User is not signed in');
      return null;
    }

    const profileQuery = new Parse.Query('Profile');
    const profile = await profileQuery
      .equalTo('user', currentUser)
      .include('profilePersonal', 'profileVendor')
      .first();

    if (!profile) {
      console.warn($FUNC, 'Failed to find profile for the current user.');
      return null;
    }

    return profile;
  }
}
