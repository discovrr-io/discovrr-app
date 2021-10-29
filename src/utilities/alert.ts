import { Alert } from 'react-native';
import { PickerErrorCode } from 'react-native-image-crop-picker';
import * as strings from 'src/constants/strings';

export function alertSomethingWentWrong(message?: string) {
  Alert.alert(
    strings.SOMETHING_WENT_WRONG.title,
    message ?? strings.SOMETHING_WENT_WRONG.message,
  );
}

export function alertUnavailableFeature(
  options: strings.AlertMessage = strings.FEATURE_UNAVAILABLE,
) {
  Alert.alert(options.title, options.message);
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
