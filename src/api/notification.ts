import Parse from 'parse/react-native';

export namespace NotificationApi {
  export type SetFCMRegistrationTokenForUserParams = {
    registrationToken: string;
  };

  export async function setFCMRegistrationTokenForUser(
    params: SetFCMRegistrationTokenForUserParams,
  ) {
    await Parse.Cloud.run('setFCMRegistrationTokenForUser', params);
  }
}
