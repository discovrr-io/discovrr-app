import Parse from 'parse/react-native';
import { SessionId } from 'src/models';

export namespace NotificationApi {
  export type SetFCMRegistrationTokenForSessionParams = {
    sessionId: SessionId;
    registrationToken: string;
  };

  export async function setFCMRegistrationTokenForSession(
    params: SetFCMRegistrationTokenForSessionParams,
  ) {
    await Parse.Cloud.run('setFCMRegistrationTokenForSession', {
      ...params,
      sessionId: String(params.sessionId),
    });
  }
}
