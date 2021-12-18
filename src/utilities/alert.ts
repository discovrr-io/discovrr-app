import { Alert } from 'react-native';
import { PickerErrorCode, Video } from 'react-native-image-crop-picker';
import { AuthApi } from 'src/api';

import * as strings from 'src/constants/strings';

import {
  MAX_VID_DURATION_MILLISECONDS,
  MAX_VID_DURATION_SECONDS,
} from 'src/constants/values';

export function alertSomethingWentWrong(message?: string) {
  Alert.alert(
    strings.SOMETHING_WENT_WRONG.title,
    message || strings.SOMETHING_WENT_WRONG.message,
  );
}

export function alertUnavailableFeature(
  options?: Partial<strings.AlertMessage>,
) {
  const {
    title = strings.FEATURE_UNAVAILABLE.title,
    message = strings.FEATURE_UNAVAILABLE.message,
  } = options ?? {};
  Alert.alert(title, message);
}

function constructAlertFromImageCropPickerError(error: any) {
  let title: string;
  let message: string;

  switch (error.code as PickerErrorCode) {
    case 'E_NO_LIBRARY_PERMISSION':
      title = 'No Library Permissions';
      message =
        "You haven't allowed Discovrr access to your photo library. Please enable this in Settings and try again.";
      break;
    case 'E_NO_CAMERA_PERMISSION':
      title = 'No Camera Permissions';
      message =
        "You haven't allowed Discovrr access to your camera. Please enable this in Settings and try again.";
    default:
      //  Also handles the case when error.code is undefined
      console.warn('Unhandled error:', error);
      title = strings.SOMETHING_WENT_WRONG.title;
      message = strings.SOMETHING_WENT_WRONG.message;
      break;
  }

  return { title, message };
}

export function alertImageCropPickerError(error: any) {
  if (error.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
  const { title, message } = constructAlertFromImageCropPickerError(error);
  Alert.alert(title, message);
}

export function alertIfAnyVideoWillBeTrimmed(videos: Video[]) {
  if (videos.length === 0) {
    return;
  }

  if (
    videos.length === 1 &&
    videos[0].duration &&
    videos[0].duration > MAX_VID_DURATION_MILLISECONDS
  ) {
    console.log(videos[0].duration);

    Alert.alert(
      'Video Will Be Trimmed',
      'This video is longer than the maximum video duration of ' +
        `${MAX_VID_DURATION_SECONDS} seconds. It will be trimmed when you ` +
        'upload it.',
    );
    return;
  }

  if (
    videos.some(
      video => video.duration && video.duration > MAX_VID_DURATION_MILLISECONDS,
    )
  ) {
    Alert.alert(
      'Video Will Be Trimmed',
      'One or more of your videos are longer than the maximum video duration ' +
        `of ${MAX_VID_DURATION_SECONDS} seconds. It will be trimmed when you ` +
        'upload it.',
    );
  }
}

const REPORT_MESSAGE =
  'Please report the following error to the Discovrr development team';

function createReportMessage(
  error: any,
  message: string = strings.SOMETHING_WENT_WRONG.message,
): string {
  let errorMessage: string;

  if (error.message) {
    errorMessage = error.message;
  } else if (error.code) {
    errorMessage = error.code;
  } else {
    errorMessage = String(error);
  }

  return `${message}\n\n${REPORT_MESSAGE}:\n\n${errorMessage}`;
}

function constructAlertFromFirebaseError(
  authError: any,
  defaultMessage?: string,
): { title: string; message: string } {
  switch (authError.code) {
    case 'USERNAME_TAKEN' as AuthApi.AuthApiErrorCode:
      return {
        title: 'Username Taken',
        message:
          'The username you provided is already taken by someone else. Please choose another username.',
      };
    case 'auth/wrong-password':
      return {
        title: 'Incorrect details',
        message:
          'The provided email or password is incorrect. Please try again.',
      };
    case 'auth/user-not-found':
      return {
        title: 'Invalid email address',
        message:
          'The email address you provided is not registered with Discovrr. Did you type it in correctly?',
      };
    case 'auth/email-already-in-use':
      return {
        title: 'Email already taken',
        message:
          'The email address you provided is already registered with Discovrr. Did you mean to sign in instead?',
      };
    case 'auth/username-taken':
      return {
        title: 'Username already taken',
        message:
          'The username you provided is already taken by someone else. Please choose another username.',
      };
    case 'auth/network-request-failed':
      return {
        title: strings.SOMETHING_WENT_WRONG.title,
        message:
          "We couldn't complete your request due to a network issue. Are you connected to the internet?",
      };

    default:
      // Also handles the case when error.code is undefined
      console.warn('Unhandled authentication error:', authError);
      return {
        title: strings.SOMETHING_WENT_WRONG.title,
        message: createReportMessage(authError, defaultMessage),
      };
  }
}

export function alertFirebaseAuthError(
  authError: any,
  defaultMessage?: string,
) {
  const { title, message } = constructAlertFromFirebaseError(
    authError,
    defaultMessage,
  );
  Alert.alert(title, message);
}
