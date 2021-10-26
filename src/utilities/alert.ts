import { Alert } from 'react-native';
import {
  AlertMessage,
  FEATURE_UNAVAILABLE,
  SOMETHING_WENT_WRONG,
} from 'src/constants/strings';

export function alertSomethingWentWrong(message?: string) {
  Alert.alert(
    SOMETHING_WENT_WRONG.title,
    message ?? SOMETHING_WENT_WRONG.message,
  );
}

export function alertUnavailableFeature(
  options: AlertMessage = FEATURE_UNAVAILABLE,
) {
  Alert.alert(options.title, options.message);
}
