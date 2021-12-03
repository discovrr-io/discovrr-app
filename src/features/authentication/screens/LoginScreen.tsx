import * as React from 'react';
import { Image, View } from 'react-native';

import * as yup from 'yup';
import { Formik, useFormikContext } from 'formik';
import { useNavigation, useRoute } from '@react-navigation/native';

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
    .required('Please type in your password')
    .min(8, 'Incomplete password'),
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
        email: profileDetails.email,
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

  return (
    <>
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
          <LoginScreenFormikForm />
        </Formik>
      </AuthFormContainer>
      {didSubmit && <LoadingOverlay message="Signing you in…" />}
    </>
  );
}

function LoginScreenFormikForm() {
  const route = useRoute<LoginScreenProps['route']>();
  const navigation = useNavigation<LoginScreenProps['navigation']>();

  const { handleSubmit, isSubmitting } = useFormikContext<LoginForm>();

  const handlePressForgotPassword = () => {
    navigation.navigate('ForgotPassword', {
      email: route.params.profileDetails.email,
    });
  };

  return (
    <View>
      <LabelledFormikPasswordInput
        fieldName="password"
        size="large"
        label="Password"
        placeholder="Enter your password"
        editable={!isSubmitting}
      />
      <Spacer.Vertical value="xl" />
      <View>
        <Button
          title="Sign In"
          type="primary"
          variant="contained"
          loading={isSubmitting}
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
    </View>
  );
}
