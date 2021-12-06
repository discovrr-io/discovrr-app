import * as React from 'react';
import { Image, View } from 'react-native';

import * as yup from 'yup';
import { Formik } from 'formik';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import { useAppDispatch, useIsMounted } from 'src/hooks';

import {
  Button,
  LabelledFormikPasswordInput,
  LoadingOverlay,
  Spacer,
} from 'src/components';

import {
  AuthPromptStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';

import AuthFormContainer from './AuthFormContainer';

const COVER_IMAGE = require('../../../../assets/images/authentication/painting.png');
const COVER_IMAGE_ASSET_SOURCE = Image.resolveAssetSource(COVER_IMAGE);

const loginFormSchema = yup.object({
  password: yup
    .string()
    .required('Please type in your password.')
    .min(8, 'Incomplete password.'),
});

type LoginForm = yup.InferType<typeof loginFormSchema>;

type LoginScreenProps = AuthPromptStackScreenProps<'Login'>;

export default function LoginScreen(props: LoginScreenProps) {
  const { profileDetails } = props.route.params;

  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const [didSubmit, setDidSubmit] = React.useState(false);

  const handleSubmit = async (values: LoginForm) => {
    try {
      setDidSubmit(true);

      const loginAction = authSlice.signInWithEmailAndPassword({
        email: profileDetails.email.trim(),
        password: values.password,
      });
      await dispatch(loginAction).unwrap();

      props.navigation.getParent<RootStackNavigationProp>().goBack();
    } catch (error) {
      console.error('Failed to login with email and password:', error);
      utilities.alertFirebaseAuthError(
        error,
        "We weren't able to sign you in at this time. Please try again later.",
      );
    } finally {
      if (isMounted.current) setDidSubmit(false);
    }
  };

  const handlePressForgotPassword = () => {
    props.navigation.navigate('ForgotPassword', {
      email: props.route.params.profileDetails.email,
    });
  };

  return (
    <AuthFormContainer
      title="Login"
      coverImageSource={COVER_IMAGE_ASSET_SOURCE}
      caption={{
        title: `Welcome back, ${profileDetails.__publicName}!`,
        body: 'Enter your password below to continue.',
        image: profileDetails.avatar
          ? { uri: profileDetails.avatar.url }
          : constants.media.DEFAULT_AVATAR,
      }}>
      <Formik<LoginForm>
        initialValues={{ password: '' }}
        validationSchema={loginFormSchema}
        onSubmit={handleSubmit}>
        {({ handleSubmit, isSubmitting }) => (
          <View>
            <LabelledFormikPasswordInput
              fieldName="password"
              size="large"
              label="Password"
              placeholder="Enter your password"
              returnKeyType="done"
              editable={!isSubmitting}
              onSubmitEditing={handleSubmit}
            />
            <Spacer.Vertical value="xl" />
            <View>
              <Button
                title="Sign In"
                type="primary"
                variant="contained"
                disabled={isSubmitting}
                onPress={handleSubmit}
              />
              <Spacer.Vertical value="md" />
              <Button
                title="Forgot Password?"
                size="small"
                type="primary"
                disabled={isSubmitting}
                onPress={handlePressForgotPassword}
              />
            </View>
            {didSubmit && (
              <LoadingOverlay
                message="Signing you in…"
                caption="This may take a while"
              />
            )}
          </View>
        )}
      </Formik>
    </AuthFormContainer>
  );
}
