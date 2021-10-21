import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  PermissionsAndroid,
  Platform,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  ToastAndroid,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as yup from 'yup';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';

import { Button, Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';
import { createPost } from 'src/features/posts/posts-slice';
import { useAppDispatch } from 'src/hooks';
import { PostLocation, PostType } from 'src/models/post';
import { alertSomethingWentWrong } from 'src/utilities';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
  RootStackNavigationProp,
} from 'src/navigation';

type TextPostForm = {
  text: string;
  location?: PostLocation;
};

const textPostSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required('Please enter at least 3 words')
    .max(280, 'Your post is too long! Please enter at most 280 characters.')
    .test('has at least 3 words', 'Please enter at least 3 words', value => {
      if (!value) return false;
      return value.trim().split(' ').length >= 3;
    }),
});

type CreateTextScreenProps = CreateItemDetailsTopTabScreenProps<'CreateText'>;

export default function CreateTextScreen(props: CreateTextScreenProps) {
  const $FUNC = '[CreateTextScreen]';
  const dispatch = useAppDispatch();
  const { navigation } = props;

  const handleCreatePost = async (values: TextPostForm) => {
    try {
      console.log($FUNC, 'Publishing text post...');

      const createPostAction = createPost({
        type: PostType.TEXT,
        text: values.text.trim(),
        location: values.location,
      });

      const newPost = await dispatch(createPostAction).unwrap();
      console.log($FUNC, 'Successfully published text post', newPost.id);

      navigation.goBack(); // Remove the Create Post pop-up
      navigation
        .getParent<CreateItemStackNavigationProp>()
        .getParent<RootStackNavigationProp>()
        .navigate('PostDetails', { postId: newPost.id });
    } catch (error) {
      console.error($FUNC, 'Failed to create text post:', error);
      alertSomethingWentWrong(
        "We weren't able to publish your post at the moment. Please try again later.",
      );
    }
  };

  return (
    <Formik
      initialValues={{ text: '' } as TextPostForm}
      validationSchema={textPostSchema}
      onSubmit={handleCreatePost}>
      <NewTextPostFormikForm />
    </Formik>
  );
}

function NewTextPostFormikForm() {
  const navigation = useNavigation<CreateTextScreenProps['navigation']>();
  const {
    dirty,
    isSubmitting,
    isValid,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useFormikContext<TextPostForm>();

  useLayoutEffect(() => {
    navigation.getParent<CreateItemStackNavigationProp>().setOptions({
      // eslint-disable-next-line react/display-name
      headerRight: () => {
        const canSubmit = dirty && isValid && !isSubmitting;
        return (
          <Button
            title="Post"
            type="primary"
            size="medium"
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={handleSubmit}
          />
        );
      },
    });
  }, [navigation, dirty, isSubmitting, isValid, handleSubmit]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={100}
        style={{ flex: 1 }}>
        <View
          style={[
            layout.defaultScreenStyle,
            { flexGrow: 1, justifyContent: 'space-between' },
          ]}>
          <TextArea
            placeholder="What's on your mind?"
            onBlur={handleBlur('text')}
            onChangeText={handleChange('text')}
            style={{ minHeight: 120 }}
          />
          <AttachLocationButton />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

type TextAreaProps = RNTextInputProps;

function TextArea(props: TextAreaProps) {
  const [_field, _meta, _helpers] = useField({
    name: 'text-area',
    type: 'text',
  });

  return (
    <RNTextInput
      {...props}
      autoFocus
      multiline
      placeholderTextColor={color.gray500}
      style={[font.extraLarge, { textAlignVertical: 'top' }, props.style]}
    />
  );
}

async function hasPermissionIOS(): Promise<boolean> {
  const status = await Geolocation.requestAuthorization('whenInUse');

  if (status === 'granted') {
    return true;
  }

  if (status === 'denied') {
    Alert.alert('You have denied location permissions');
  }

  if (status === 'disabled') {
    Alert.alert(
      `Turn on Location Services to allow "Discovrr" to determine your location.`,
      undefined,
      [
        {
          text: 'Go to Settings',
          onPress: () =>
            Linking.openSettings().catch(() =>
              Alert.alert('Unable to open settings', 'Please try again later.'),
            ),
        },
        { text: "Don't Use Location", onPress: () => {} },
      ],
    );
  }

  return false;
}

async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return await hasPermissionIOS();
  }

  if (Platform.OS === 'android' && Platform.Version < 23) {
    return true;
  }

  const hasPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  if (status === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }

  if (status === PermissionsAndroid.RESULTS.DENIED) {
    ToastAndroid.show('Location permission denied by user.', ToastAndroid.LONG);
  } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    ToastAndroid.show(
      'Location permission revoked by user.',
      ToastAndroid.LONG,
    );
  }

  return false;
}

function AttachLocationButton() {
  const [location, setLocation] = useState<Geolocation.GeoPosition | null>(
    null,
  );

  useEffect(() => {
    return () => {
      console.log('Stopping Geolocation observation…');
      Geolocation.stopObserving();
    };
  }, []);

  const getCurrentLocation = async () => {
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      position => {
        console.log('CURRENT LOCATION:', position);
        setLocation(position);
      },
      error => {
        console.error('ERROR:', error);
        Alert.alert('Failed to get current location', error.message);
        setLocation(null);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        timeout: 15_000,
        maximumAge: 10_000,
      },
    );
  };

  return (
    <TouchableOpacity
      onPress={getCurrentLocation}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layout.spacing.md,
      }}>
      <Icon name="location" size={24} color={color.black} />
      <Spacer.Horizontal value={layout.spacing.sm} />
      <Text style={[font.medium]}>
        {location
          ? `(${location.coords.latitude},${location.coords.longitude})`
          : 'Get my current location…'}
      </Text>
    </TouchableOpacity>
  );
}
