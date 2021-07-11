import Parse from 'parse/react-native';

export namespace UserApi {
  export async function getCurrentUserProfile(): Promise<Parse.Object<Parse.Attributes> | null> {
    const $FUNC = '[UserApi.getCurrentUserProfile]';

    const currentUser = await Parse.User.currentAsync();
    if (!currentUser) return null;

    const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
    profileQuery.equalTo('owner', currentUser);

    const profile = await profileQuery.first();
    console.log($FUNC, 'Found current user profile:', profile?.id);
    return profile;
  }
}
