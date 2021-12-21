import * as React from 'react';

import * as onboardingSlice from './onboarding-slice';
import { OnboardingApi } from 'src/api';
import { useAppDispatch } from 'src/hooks';

import {
  OnboardingStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';

import {
  OnboardingContentContainer,
  OptionGroup,
  OptionGroupProps,
} from './components';

type OnboardingSurveyScreenProps =
  OnboardingStackScreenProps<'OnboardingAccountType'>;

export default function OnboardingSurveyScreen(
  props: OnboardingSurveyScreenProps,
) {
  const dispatch = useAppDispatch();
  const { nextIndex } = props.route.params;

  const [selectedValue, setSelectedValue] =
    React.useState<OnboardingApi.OnboardingSurveyResponse>();

  const optionLabel = React.useCallback(
    (option: OnboardingApi.OnboardingSurveyResponse) => {
      switch (option) {
        case 'facebook':
          return 'Facebook';
        case 'instagram':
          return 'Instagram';
        case 'youtube':
          return 'YouTube';
        case 'website':
          return 'From the Discovrr website';
        case 'friend':
          return 'From a friend';
        case 'other':
        default:
          return 'Other';
      }
    },
    [],
  );

  const options = React.useMemo<
    OptionGroupProps<OnboardingApi.OnboardingSurveyResponse>['options']
  >(() => {
    return OnboardingApi.ONBOARDING_SURVEY_RESPONSE_ARRAY.map(option => ({
      value: option,
      label: optionLabel(option),
    }));
  }, [optionLabel]);

  const handleFinishOnboarding = React.useCallback(async () => {
    props.navigation.getParent<RootStackNavigationProp>().goBack();

    const saveOnboardingSurveyResultAction =
      onboardingSlice.saveOnboardingSurveyResult({ response: selectedValue });

    dispatch(saveOnboardingSurveyResultAction)
      .unwrap()
      .catch(error => {
        console.warn('Failed to save onboarding survey response:', error);
      });
  }, [dispatch, props.navigation, selectedValue]);

  return (
    <OnboardingContentContainer
      page={nextIndex}
      title="One last question"
      body="Where did you hear about us?"
      footerActions={[{ title: 'Finish', onPress: handleFinishOnboarding }]}>
      <OptionGroup<OnboardingApi.OnboardingSurveyResponse>
        size="small"
        value={selectedValue}
        onValueChanged={newValue => setSelectedValue(newValue)}
        options={options}
        labelProps={{ weight: 'normal' }}
      />
    </OnboardingContentContainer>
  );
}
