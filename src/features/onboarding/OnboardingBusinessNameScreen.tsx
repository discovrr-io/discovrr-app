import * as React from 'react';
import { TextInput as RNTextInput, View } from 'react-native';

// import { useFocusEffect } from '@react-navigation/native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as globalSelectors from 'src/global-selectors';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { Spacer, Text, TextInput } from 'src/components';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { OnboardingStackScreenProps } from 'src/navigation';

import { OnboardingContentContainer } from './components';
import { useDisableGoBackOnSubmitting } from './hooks';

type OnboardingBusinessNameScreenProps =
  OnboardingStackScreenProps<'OnboardingBusinessName'>;

export default function OnboardingBusinessNameScreen(
  props: OnboardingBusinessNameScreenProps,
) {
  const dispatch = useAppDispatch();
  const myProfile = useAppSelector(globalSelectors.selectCurrentUserProfile);
  const { nextIndex } = props.route.params;

  const textInputRef = React.useRef<RNTextInput>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [businessName, setBusinessName] = React.useState(() => {
    console.log({ __KIND: myProfile?.kind, __BN: myProfile['businessName'] });

    if (myProfile?.kind === 'vendor') {
      return myProfile.businessName || myProfile.displayName;
    } else {
      // There shouldn't be a case where we don't receive a vendor profile here
      // but we'll handle it here anyway
      return myProfile?.displayName;
    }
  });

  // useFocusEffect(
  //   React.useCallback(() => {
  //     textInputRef.current?.focus();
  //   }, []),
  // );

  useDisableGoBackOnSubmitting(isSubmitting);

  const handlePressNext = async () => {
    try {
      const trimmedBusinessName = businessName?.trim();

      if (!myProfile || !trimmedBusinessName || myProfile.kind === 'personal')
        throw new Error(
          "We weren't able to change your business name right now. " +
            'You can try again later by going to your profile settings.',
        );

      if (trimmedBusinessName !== myProfile.businessName) {
        setIsSubmitting(true);
        await dispatch(
          profilesSlice.updateProfile({
            profileId: myProfile.profileId,
            changes: { businessName: trimmedBusinessName },
          }),
        ).unwrap();
      }

      props.navigation.navigate('OnboardingUsername', {
        nextIndex: nextIndex + 1,
      });
    } catch (error: any) {
      utilities.alertSomethingWentWrong(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingContentContainer
      page={nextIndex}
      useKeyboardAvoidingView
      title="What’s your business name?"
      body="Your business name will be visible in your public profile. You can use your personal name."
      footerActions={[
        {
          title: 'Next',
          loading: isSubmitting,
          disabled: !Boolean(businessName?.trim()),
          onPress: handlePressNext,
        },
      ]}>
      <View>
        <TextInput
          ref={textInputRef}
          // autoFocus
          size="large"
          placeholder="Enter your name"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          returnKeyType="done"
          value={businessName}
          onChangeText={setBusinessName}
          onSubmitEditing={handlePressNext}
        />
        <Spacer.Vertical value="md" />
        <Text
          size="sm"
          color="caption"
          allowFontScaling={false}
          style={{ marginLeft: constants.layout.spacing.md }}>
          We’ll use your business name in any forms of formal communication you
          make to customers. You can always change it later.
        </Text>
      </View>
    </OnboardingContentContainer>
  );
}
