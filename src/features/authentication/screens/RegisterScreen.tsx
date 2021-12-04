import * as React from 'react';
import { Image, Text, View } from 'react-native';

import * as yup from 'yup';
import { Formik } from 'formik';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import { useAppDispatch, useExtendedTheme, useIsMounted } from 'src/hooks';

import {
  AuthPromptStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';

import {
  Button,
  LabelledFormikPasswordInput,
  LabelledFormikTextInput,
  LoadingOverlay,
  Spacer,
} from 'src/components';

import AuthFormContainer from './AuthFormContainer';

const COVER_IMAGE = require('../../../../assets/images/authentication/sculpting.png');
const COVER_IMAGE_ASSET_SOURCE = Image.resolveAssetSource(COVER_IMAGE);
const DISCOVRR_LOGO_MARK = require('../../../../assets/images/logomark.png');

const registerFormSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .required('Please provide your email address.'),
  password: yup
    .string()
    .required('Please provide a password.')
    .min(8, 'Your password should have at least 8 characters.'),
  displayName: yup
    .string()
    .trim()
    .required('Please provide your personal or business name.'),
  username: yup
    .string()
    .trim()
    .required('Please provide a unique username.')
    .min(3, 'Your username should have at least 3 characters.')
    .max(30, 'Your username should not be more than 30 characters')
    .matches(
      constants.regex.USERNAME_REGEX,
      'Your username should only contains letters, numbers, dots and underscores with no spaces.',
    )
    .test(
      'it is not a repeated set of dots or underscores',
      "Please choose a more identifiable username that's easier for everyone to read and type.",
      input => {
        if (!input) return false;
        return !/^(?:\.|_){3,}$/.test(input);
      },
    ),
});

type RegisterForm = yup.InferType<typeof registerFormSchema>;

type RegisterScreenProps = AuthPromptStackScreenProps<'Register'>;

export default function RegisterScreen(props: RegisterScreenProps) {
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();
  const { colors } = useExtendedTheme();

  const [didSubmit, setDidSubmit] = React.useState(false);

  const handleSubmit = async (values: RegisterForm) => {
    try {
      setDidSubmit(true);
      console.log('Creating new account...');

      const registerAction = authSlice.registerNewAccount({
        ...values,
        email: values.email.trim(),
        displayName: values.displayName.trim(),
        username: values.username.trim(),
      });
      await dispatch(registerAction).unwrap();

      props.navigation.getParent<RootStackNavigationProp>().goBack();
      console.log('Finished creating account');
    } catch (error) {
      console.error('Failed to create account:', error);
      utilities.alertFirebaseAuthError(
        error,
        "We weren't able to create your account at this time. Please try again later",
      );
    } finally {
      if (isMounted.current) setDidSubmit(false);
    }
  };

  const handleShowTermsAndConditions = () => {
    props.navigation.push('TermsAndConditions');
  };

  return (
    <AuthFormContainer
      title="Register"
      coverImageSource={COVER_IMAGE_ASSET_SOURCE}
      caption={{
        title: 'Welcome to Discovrr!',
        body: "Fill in the details below to create a new account with us. It's that easy!",
        image: DISCOVRR_LOGO_MARK,
        imageStyles: [{ backgroundColor: 'transparent' }],
      }}>
      <Formik<RegisterForm>
        initialValues={{
          email: props.route.params?.email ?? '',
          password: '',
          displayName: '',
          username: '',
        }}
        validationSchema={registerFormSchema}
        onSubmit={handleSubmit}>
        {({ handleSubmit }) => (
          <View>
            <View>
              <LabelledFormikTextInput
                fieldName="email"
                size="large"
                label="Email"
                placeholder="Enter your email address"
              />
              <Spacer.Vertical value="lg" />
              <LabelledFormikPasswordInput
                fieldName="password"
                size="large"
                label="Password"
                placeholder="Type in a secure password"
              />
              <Spacer.Vertical value="lg" />
              <LabelledFormikTextInput
                fieldName="displayName"
                size="large"
                label="Personal or Business Name"
                placeholder="How should we call you?"
                autoCapitalize="words"
              />
              <Spacer.Vertical value="lg" />
              <LabelledFormikTextInput
                fieldName="username"
                size="large"
                label="Username"
                placeholder="Type in a unique username"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
              />
            </View>
            <Spacer.Vertical value="xl" />
            <View>
              <Button
                title="Create Account"
                type="primary"
                variant="contained"
                onPress={handleSubmit}
              />
              <Spacer.Vertical value="md" />
              <Text
                style={[
                  constants.font.extraSmall,
                  { color: colors.caption, textAlign: 'center' },
                ]}>
                By continuing, you agree to our{' '}
                <Text
                  onPress={handleShowTermsAndConditions}
                  style={[
                    { color: colors.primary, textDecorationLine: 'underline' },
                  ]}>
                  Terms & Conditions
                </Text>
                {'.'}
              </Text>
            </View>
            {didSubmit && (
              <LoadingOverlay
                message="Creating your account…"
                caption="This may take a while"
              />
            )}
          </View>
        )}
      </Formik>
    </AuthFormContainer>
  );
}
