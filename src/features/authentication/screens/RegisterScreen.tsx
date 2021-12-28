import * as React from 'react';
import { Image, Text, View } from 'react-native';

import * as yup from 'yup';
import analytics from '@react-native-firebase/analytics';
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
});

type RegisterForm = yup.InferType<typeof registerFormSchema>;

type RegisterScreenProps = AuthPromptStackScreenProps<'Register'>;

export default function RegisterScreen(props: RegisterScreenProps) {
  const $FUNC = '[RegisterScreen]';
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();
  const { colors } = useExtendedTheme();

  const [didSubmit, setDidSubmit] = React.useState(false);

  const handleSubmit = async (values: RegisterForm) => {
    try {
      setDidSubmit(true);
      console.log($FUNC, 'Creating new account...');

      const registerAction = authSlice.registerNewAccount({
        ...values,
        email: values.email.trim(),
      });

      await dispatch(registerAction).unwrap();
      analytics()
        .logSignUp({ method: 'password' })
        .catch(utilities.warnLogEventFailure);

      props.navigation.getParent<RootStackNavigationProp>().goBack();
    } catch (error: any) {
      console.error($FUNC, 'Failed to create account:', error);
      utilities.alertFirebaseAuthError(
        error,
        'We weren’t able to create your account at this time. Please try again later',
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
        body: 'Fill in the details below to create a new account with us. It’s that easy!',
        image: DISCOVRR_LOGO_MARK,
        imageStyles: [{ backgroundColor: 'transparent' }],
      }}>
      <Formik<RegisterForm>
        initialValues={{
          email: props.route.params?.email ?? '',
          password: '',
        }}
        validationSchema={registerFormSchema}
        onSubmit={handleSubmit}>
        {({ handleSubmit, isSubmitting }) => (
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
            </View>
            <Spacer.Vertical value="xl" />
            <View>
              <Button
                title="Create Account"
                type="primary"
                variant="contained"
                disabled={isSubmitting}
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
