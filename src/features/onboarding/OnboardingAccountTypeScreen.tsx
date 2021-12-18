import * as React from 'react';

import * as globalSelectors from 'src/global-selectors';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { ProfileKind } from 'src/models';
import { OnboardingStackScreenProps } from 'src/navigation';

import { OnboardingContentContainer, OptionGroup } from './components';

type OnboardingAccountTypeScreenProps =
  OnboardingStackScreenProps<'OnboardingAccountType'>;

export default function OnboardingAccountTypeScreen(
  props: OnboardingAccountTypeScreenProps,
) {
  const dispatch = useAppDispatch();
  const myProfile = useAppSelector(globalSelectors.selectCurrentUserProfile);

  React.useEffect(() => {
    console.log({ myProfile });
  }, [myProfile]);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<ProfileKind>(
    myProfile?.kind ?? 'personal',
  );

  const handlePressNext = async () => {
    if (selectedValue !== myProfile?.kind) {
      try {
        setIsProcessing(true);
        await dispatch(
          profilesSlice.changeProfileKind({ kind: selectedValue }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to switch to maker:', error);
        return myProfile;
      } finally {
        setIsProcessing(false);
      }
    }

    props.navigation.navigate('OnboardingPersonalName');
  };

  return (
    <OnboardingContentContainer
      page={1}
      title="What best describes you?"
      body="You can always change this later."
      footerActions={[
        { title: 'Next', onPress: handlePressNext, loading: isProcessing },
      ]}>
      <OptionGroup<ProfileKind>
        value={selectedValue}
        onValueChanged={newValue => setSelectedValue(newValue)}
        options={[
          {
            label: "I'm a user",
            caption:
              'I want to purchase and engage in content by other users and makers.',
            value: 'personal',
          },
          {
            label: "I'm a maker",
            caption:
              'I want to sell my products to an engaged local community.',
            value: 'vendor',
          },
        ]}
      />
    </OnboardingContentContainer>
  );
}
