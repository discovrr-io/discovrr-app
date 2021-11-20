import { Alert } from 'react-native';
import { PickerErrorCode, Video } from 'react-native-image-crop-picker';

import * as strings from 'src/constants/strings';

import {
  MAX_VID_DURATION_MILLISECONDS,
  MAX_VID_DURATION_SECONDS,
} from 'src/constants/values';

export function alertSomethingWentWrong(message?: string) {
  Alert.alert(
    strings.SOMETHING_WENT_WRONG.title,
    message ?? strings.SOMETHING_WENT_WRONG.message,
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

export function constructAlertFromImageCropPickerError(error: any): {
  title: string;
  message: string;
} {
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
