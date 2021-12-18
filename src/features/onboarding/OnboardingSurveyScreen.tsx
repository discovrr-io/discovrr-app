import * as React from 'react';
import { Platform } from 'react-native';

import * as onboardingSlice from './onboarding-slice';
import * as globalSelectors from 'src/global-selectors';
import { useAppDispatch, useAppSelector } from 'src/hooks';

import {
  OnboardingContentContainer,
  OptionGroup,
  OptionGroupProps,
} from './components';

import {
  OnboardingStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';
import { OnboardingApi } from 'src/api';
type OnboardingSurveyScreenProps =
  OnboardingStackScreenProps<'OnboardingAccountType'>;

export default function OnboardingSurveyScreen(
  props: OnboardingSurveyScreenProps,
) {
  const dispatch = useAppDispatch();
  const myProfile = useAppSelector(globalSelectors.selectCurrentUserProfile);

  React.useEffect(() => {
    console.log({ myProfile });
  }, [myProfile]);

  const [isProcessing, setIsProcessing] = React.useState(false);
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

  const handlePressFinish = async () => {
    try {
      setIsProcessing(true);
      await dispatch(
        onboardingSlice.saveOnboardingSurveyResult({ response: selectedValue }),
      ).unwrap();
    } catch (error) {
      console.warn('Failed to save onboarding survey response:', error);
    } finally {
      setIsProcessing(false);
      props.navigation.getParent<RootStackNavigationProp>().navigate('Main', {
        screen: 'Facade',
        params: { screen: 'Home', params: { screen: 'Landing' } },
      });
    }
  };

  return (
    <OnboardingContentContainer
      page={Platform.select({ ios: 6, default: 5 })}
      title="One last thing"
      body="Where did you hear about us?"
      footerActions={[
        { title: 'Finish', onPress: handlePressFinish, loading: isProcessing },
      ]}>
      <OptionGroup<OnboardingApi.OnboardingSurveyResponse>
        size="small"
        value={selectedValue}
        onValueChanged={newValue => setSelectedValue(newValue)}
        options={options}
        labelProps={{ weight: 'regular' }}
      />
    </OnboardingContentContainer>
  );
}
