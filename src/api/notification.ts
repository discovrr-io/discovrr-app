import Parse from 'parse/react-native';

export namespace NotificationApi {
  export type SetFCMRegistrationTokenForProfileParams = {
    profileId: string;
    deviceToken: string;
    deviceType: 'ios' | 'android' | 'winrt' | 'winphone' | 'dotnet';
  };

  export async function setFCMRegistrationTokenForProfile(
    params: SetFCMRegistrationTokenForProfileParams,
  ) {
    await Parse.Cloud.run('setFCMRegistrationTokenForProfile', params);
  }
}
