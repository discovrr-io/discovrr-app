import * as React from 'react';
import {
  ActivityIndicator,
  TextInput as RNTextInput,
  View,
} from 'react-native';

import _ from 'lodash';
import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';
import { useRoute } from '@react-navigation/native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as globalSelectors from 'src/global-selectors';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { AuthApi } from 'src/api';
import { Spacer, Text, TextInput } from 'src/components';
import { useAppDispatch, useAppSelector, useExtendedTheme } from 'src/hooks';
import { Profile } from 'src/models';
import { OnboardingStackScreenProps } from 'src/navigation';

import { OnboardingContentContainer } from './components';
import { useDisableGoBackOnSubmitting } from './hooks';

const USERNAME_REQUIREMENTS_STRING =
  'Your username should only contain letters, numbers, dots and underscores with no spaces. You can always change it later.';

const usernameFormSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required('Please provide a unique username.')
    .min(3, 'Your username should have at least 3 characters.')
    .max(30, 'Your username should not be more than 30 characters.')
    .test(
      'it is not a repeated set of dots or underscores',
      "Please choose another username that's easier for others to identify.",
      input => {
        if (!input) return false;
        return !/^(?:\.|_){3,}$/.test(input);
      },
    )
    .matches(constants.regex.USERNAME_REGEX, USERNAME_REQUIREMENTS_STRING),
});

type UsernameForm = yup.InferType<typeof usernameFormSchema>;

type OnboardingUsernameScreenProps =
  OnboardingStackScreenProps<'OnboardingUsername'>;

export default function OnboardingUsernameScreen(
  props: OnboardingUsernameScreenProps,
) {
  const dispatch = useAppDispatch();
  const myProfile = useAppSelector(globalSelectors.selectCurrentUserProfile);
  const { nextIndex } = props.route.params;

  const handleSubmitForm = async ({ username }: UsernameForm) => {
    try {
      if (!myProfile)
        throw new Error(
          "We weren't able to change your name right now. " +
            'You can try again later by going to your profile settings.',
        );

      if (username !== myProfile.username) {
        await dispatch(
          profilesSlice.updateProfile({
            profileId: myProfile.profileId,
            changes: { username: username.trim() },
          }),
        ).unwrap();
      }

      props.navigation.navigate('OnboardingProfilePicture', {
        nextIndex: nextIndex + 1,
      });
    } catch (error: any) {
      utilities.alertSomethingWentWrong(error.message);
    }
  };

  return (
    <Formik<UsernameForm>
      initialValues={{ username: myProfile?.username || '' }}
      validationSchema={usernameFormSchema}
      onSubmit={async (values, helpers) => {
        await handleSubmitForm(values);
        helpers.resetForm({ values });
      }}>
      <UsernameFormikForm myProfile={myProfile} />
    </Formik>
  );
}

type UsernameFormikTextInputProps = {
  myProfile: Profile | undefined;
};

function UsernameFormikForm({ myProfile }: UsernameFormikTextInputProps) {
  const { handleSubmit, isValid, isSubmitting } =
    useFormikContext<UsernameForm>();

  const route = useRoute<OnboardingUsernameScreenProps['route']>();
  const { colors } = useExtendedTheme();

  const textInputRef = React.useRef<RNTextInput>(null);
  const [field, meta] = useField('username');

  // useFocusEffect(
  //   React.useCallback(() => {
  //     textInputRef.current?.focus();
  //   }, []),
  // );

  const [isAvailable, setIsAvailable] = React.useState(true);
  const [isChecking, setIsChecking] = React.useState(false);

  const checkUsernameAvailability = React.useMemo(
    () =>
      _.debounce(async (input: string) => {
        try {
          setIsChecking(true);
          setIsAvailable(
            input === myProfile?.username ||
              ((await usernameFormSchema.isValid({ username: input })) &&
                (await AuthApi.checkIfUsernameAvailable(input))),
          );
        } catch (error) {
          console.warn('Failed to check username availability:', error);
        } finally {
          setIsChecking(false);
        }
      }, 200),
    [myProfile?.username],
  );

  React.useEffect(() => {
    if (field.value !== myProfile?.username) {
      checkUsernameAvailability(field.value.trim());
    } else {
      setIsAvailable(true);
    }
  }, [field.value, checkUsernameAvailability, myProfile]);

  useDisableGoBackOnSubmitting(isSubmitting);

  return (
    <OnboardingContentContainer
      page={route.params.nextIndex}
      useKeyboardAvoidingView
      title="Choose a username"
      body="We’ve suggested one for you below. Or you can choose your own if you want."
      footerActions={[
        {
          title: 'Next',
          onPress: handleSubmit,
          disabled: isChecking || !isAvailable || !isValid,
          loading: isSubmitting,
        },
      ]}>
      <View>
        <TextInput
          ref={textInputRef}
          // autoFocus
          size="large"
          placeholder="Type in a unique username"
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          returnKeyType="next"
          value={field.value}
          onBlur={field.onBlur('username')}
          onChangeText={field.onChange('username')}
          prefix={<TextInput.Affix text="@" />}
          suffix={
            isChecking ? (
              <ActivityIndicator size="small" color={colors.caption} />
            ) : (
              <TextInput.Icon
                size={24}
                name={isAvailable ? 'checkmark-circle' : 'close-circle'}
                color={
                  isAvailable
                    ? constants.color.green500
                    : constants.color.red500
                }
              />
            )
          }
        />
        <Spacer.Vertical value="md" />
        <Text
          size="sm"
          color="caption"
          allowFontScaling={false}
          style={[
            { marginLeft: constants.layout.spacing.md },
            Boolean(meta.error) && {
              color: colors.danger,
            },
          ]}>
          {meta.error || USERNAME_REQUIREMENTS_STRING}
        </Text>
      </View>
    </OnboardingContentContainer>
  );
}
