import Parse from 'parse/react-native';
import { SessionId } from 'src/models';

export namespace SessionApi {
  export type SetAppVersionForSession = {
    sessionId: SessionId;
    appVersion: string;
    storeVersion: string;
  };

  export async function setAppVersionForSession(
    params: SetAppVersionForSession,
  ) {
    await Parse.Cloud.run('setAppVersionForSession', params);
  }
}
