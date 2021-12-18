import * as React from 'react';
import { TextInput as RNTextInput, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as globalSelectors from 'src/global-selectors';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { Spacer, Text, TextInput } from 'src/components';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { OnboardingStackScreenProps } from 'src/navigation';

import { OnboardingContentContainer } from './components';

type OnboardingPersonalNameScreenProps =
  OnboardingStackScreenProps<'OnboardingPersonalName'>;

export default function OnboardingPersonalNameScreen(
  props: OnboardingPersonalNameScreenProps,
) {
  const dispatch = useAppDispatch();
  const myProfile = useAppSelector(globalSelectors.selectCurrentUserProfile);
  React.useEffect(() => {
    console.log({ myProfile });
  }, [myProfile]);

  const textInputRef = React.useRef<RNTextInput>(null);

  const [displayName, setDisplayName] = React.useState(myProfile?.displayName);
  const [isSaving, setIsSaving] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      textInputRef.current?.focus();
    }, []),
  );

  const handlePressNext = async () => {
    try {
      const trimmedDisplayName = displayName?.trim();

      if (!myProfile || !trimmedDisplayName)
        throw new Error(
          "We weren't able to change your name right now. " +
            'You can try again later by going to your profile settings.',
        );

      if (trimmedDisplayName !== myProfile.displayName) {
        setIsSaving(true);
        await dispatch(
          profilesSlice.updateProfile({
            profileId: myProfile.profileId,
            changes: { displayName: trimmedDisplayName },
          }),
        ).unwrap();
      }

      props.navigation.navigate('OnboardingUsername');
    } catch (error: any) {
      utilities.alertSomethingWentWrong(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingContentContainer
      page={2}
      useKeyboardAvoidingView
      title="What’s your name?"
      body={
        myProfile?.kind === 'vendor'
          ? 'This will only be visible to the Discovrr team for identification purposes.'
          : 'This will be displayed on your public profile.'
      }
      footerActions={[
        {
          title: 'Next',
          loading: isSaving,
          disabled: !Boolean(displayName?.trim()),
          onPress: handlePressNext,
        },
      ]}>
      <View>
        <TextInput
          ref={textInputRef}
          autoFocus
          size="large"
          placeholder="Enter your name"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Spacer.Vertical value="md" />
        <Text
          size="sm"
          color="caption"
          allowFontScaling={false}
          style={{ marginLeft: constants.layout.spacing.md }}>
          {myProfile?.kind === 'vendor'
            ? 'Because you are a maker, your name will not be visible to others. It will only be kept by us for internal bookkeeping purposes.'
            : `Your name will be displayed in your public profile and in any forms of communication we make to you. You can always change it later.`}
        </Text>
      </View>
    </OnboardingContentContainer>
  );
}
