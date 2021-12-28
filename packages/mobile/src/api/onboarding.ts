import Parse from 'parse/react-native';
import { UserApi } from './user';

export namespace OnboardingApi {
  export const ONBOARDING_SURVEY_RESPONSE_ARRAY = [
    'facebook',
    'instagram',
    'youtube',
    'website',
    'friend',
    'other',
  ] as const;

  export type OnboardingSurveyResponse =
    typeof ONBOARDING_SURVEY_RESPONSE_ARRAY[number];

  export type SaveOnboardingSurveyResultParams = {
    response: OnboardingSurveyResponse | undefined;
  };

  export async function saveOnboardingSurveyResult(
    props: SaveOnboardingSurveyResultParams,
  ) {
    if (props.response) {
      const survey = await new Parse.Query('Survey')
        .equalTo('response', props.response)
        .first();

      survey?.increment('count');
      await survey?.save();
    }

    const myProfile = await UserApi.getCurrentUserProfile();
    await myProfile?.save({ didSetUpProfile: true });
  }
}
