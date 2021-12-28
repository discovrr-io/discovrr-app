import * as React from 'react';
import { Alert, Image, View } from 'react-native';

import * as yup from 'yup';
import auth from '@react-native-firebase/auth';
import { Formik } from 'formik';

import * as utilities from 'src/utilities';
import { Button, LabelledFormikTextInput, Spacer } from 'src/components';
import { AuthPromptStackScreenProps } from 'src/navigation';

import AuthFormContainer from './AuthFormContainer';

const COVER_IMAGE = require('../../../../assets/images/authentication/sewing.png');
const COVER_IMAGE_ASSET_SOURCE = Image.resolveAssetSource(COVER_IMAGE);

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .required('Please provide your email address.'),
});

type ForgotPasswordForm = yup.InferType<typeof forgotPasswordSchema>;

type ForgotPasswordScreenProps = AuthPromptStackScreenProps<'ForgotPassword'>;

export default function ForgotPasswordScreen(props: ForgotPasswordScreenProps) {
  const handleSubmit = async (values: ForgotPasswordForm) => {
    try {
      await auth().sendPasswordResetEmail(values.email.trim());
      Alert.alert(
        'Reset Link Sent',
        'We’ve sent you an email with instructions on how to reset your password.\n\nMake sure to check your junk mail if you don’t see an email from us.',
      );
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          'Invalid Email Address',
          'The email address you provided is not registered with us. Did you type it in correctly?',
        );
      } else {
        utilities.alertFirebaseAuthError(
          error,
          'We weren’t able to reset your password for you at this time. Please try again later.',
        );
      }
    }
  };

  return (
    <AuthFormContainer
      title="Forgot your password?"
      coverImageSource={COVER_IMAGE_ASSET_SOURCE}
      caption={{
        body: 'Don’t worry, it happens! Just enter your email address below and we’ll send you a reset link.',
      }}>
      <Formik<ForgotPasswordForm>
        initialValues={{ email: props.route.params?.email ?? '' }}
        validationSchema={forgotPasswordSchema}
        onSubmit={handleSubmit}>
        {({ handleSubmit, isSubmitting }) => (
          <View>
            <LabelledFormikTextInput
              fieldName="email"
              size="large"
              label="Email"
              placeholder="Enter your email address"
              returnKeyType="done"
              editable={!isSubmitting}
              onSubmitEditing={handleSubmit}
            />
            <Spacer.Vertical value="xl" />
            <Button
              title="Send Me Reset Link"
              type="primary"
              variant="contained"
              loading={isSubmitting}
              onPress={handleSubmit}
            />
          </View>
        )}
      </Formik>
    </AuthFormContainer>
  );
}
