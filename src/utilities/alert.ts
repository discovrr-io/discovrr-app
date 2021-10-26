import { Alert } from 'react-native';
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
