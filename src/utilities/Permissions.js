import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';

// import Voice from 'react-native-voice';
// import Camera from 'react-native-camera';
// import { RNCamera } from 'react-native-camera'
// import OpenSettings from 'react-native-open-settings';
import AsyncStorage from '@react-native-community/async-storage';
// import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';

import appConfig from '../../appConfig';
import { logException } from './NetworkRequests';

const isAtLeastMarshmallow = Platform.Version > 22;

const pTypes = {
  audio: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  camera: PermissionsAndroid.PERMISSIONS.CAMERA,
  rContacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  wContacts: PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
  storage: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  phone: PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  photo: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  sms: PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
};

const rationale = {
  audio: { title: 'Microphone Access', message: `Granting ${appConfig.appName} microphone permission, allows you to speak search queries.` },
  camera: { title: 'Camera Access', message: `Granting ${appConfig.appName} camera permission, allows you to capture images and scan codes.` },
  contacts: { title: 'Contacts Access', message: `Granting ${appConfig.appName} contacts permission, allows you to save contact details into your phone book.` },
  sms: { title: 'Automatic SMS Verification', message: `Please allow ${appConfig.appName} to receive SMS so that we can automatically capture and authenticate ${appConfig.appName} verification codes sent to you.` },
  attach: { title: 'Camera and Storage Access', message: `To capture and attach images, allow ${appConfig.appName} permission to access the camera and local storage.` },
  location: { title: 'Location Access', message: `To sort and show distributors near you, allow ${appConfig.appName} permission to briefly access the your location.` },
};

const deniedRationale = {
  audio: { title: '', message: `To hear and recognize your speech queries, please grant ${appConfig.appName} access to the microphone.` },
  attach: { title: '', message: `To capture and attach images, please grant ${appConfig.appName} access to both the camera and local storage.` },
  camera: { title: '', message: `To scan for codes, please grant ${appConfig.appName} access to the camera.` },
  contacts: { title: '', message: `To save contacts into your phone book, please grant ${appConfig.appName} access to your contacts.` },
  capture: { title: '', message: `To capture and attach images, please grant ${appConfig.appName} access to the camera.` },
  photos: { title: '', message: `To attach images, please grant ${appConfig.appName} access to your photos.` },
  phone: { title: '', message: `To securily process your payment request, please grant ${appConfig.appName} access to the phone state.` },
  speech: { title: '', message: `To recognize and use speech queries, please grant ${appConfig.appName} access to Speech Recognition.` },
  storage: { title: '', message: `To share content, please grant ${appConfig.appName} access to local storage so that we can share images with other apps.` },
  location: { title: '', message: `To sort and show distributors near you, please grant ${appConfig.appName} brief access to your location.` },
};

const neverAskRationale = {
  audio: { title: 'Microphone Access Denied', message: `To recognize speech, please grant ${appConfig.appName} access to record audio using the microphone.\n\nChange Permissions in your device's app settings.` },
  attach: { title: 'Camera & Storage Access Denied', message: `o capture and attach images, please grant ${appConfig.appName} access to both the camera and local storage.\n\nChange Permissions in your device's app settings.` },
  camera: { title: 'Camera Access Denied', message: `To scan for codes, please grant ${appConfig.appName} access to the camera.\n\nChange Permissions in your device's app settings.` },
  contacts: { title: 'Contacts Access Denied', message: `To save contact info into your contacts, please grant ${appConfig.appName} access to your contacts.\n\nChange Permissions in your device's app settings.` },
  phone: { title: 'Phone State Denied', message: `To securily process your payment request, please grant ${appConfig.appName} access to the phone state.\n\nChange Permissions in your device's app settings.` },
  storage: { title: 'Storage Access Denied', message: `To share content, please grant ${appConfig.appName} access to local storage so that we can share images with other apps.\n\nChange Permissions in your device's app settings.` },
  location: { title: 'Location Access Denied', message: `To sort and show distributors near you, please grant ${appConfig.appName} brief access to your location.\n\nChange Permissions in your device's app settings.` },
};

const errorInfo = {
  audio: { title: 'Oops!', message: 'An error occurred while trying to request microphone permissions.\n\nChange Permissions in your device\'s app settings.' },
  attach: { title: 'Oops!', message: 'An error occurred while trying to request camera and local storage permissions.\n\nChange Permissions in your device\'s app settings.' },
  camera: { title: 'Oops!', message: 'An error occurred while trying to request camera permission.\n\nChange Permissions in your device\'s app settings.' },
  contacts: { title: 'Oops!', message: 'An error occurred while trying to request contacts permission.\n\nChange Permissions in your device\'s app settings.' },
  capture: { title: 'Oops!', message: 'An error occurred while trying to request camera permission.\n\nChange Permissions in your device\'s app settings.' },
  phone: { title: 'Oops!', message: 'An error occurred while trying to request phone state permission.\n\nChange Permissions in your device\'s app settings.' },
  photos: { title: 'Oops!', message: 'An error occurred while trying to request photos permission.\n\nChange Permissions in your device\'s app settings.' },
  speech: { title: 'Oops!', message: 'An error occurred while trying to request speech recognition permission.\n\nChange Permissions in your device\'s app settings.' },
  storage: { title: 'Oops!', message: 'An error occurred while trying to request local storage permission.\n\nChange Permissions in your device\'s app settings.' },
  location: { title: 'Oops!', message: 'An error occurred while trying to request location permission.\n\nChange Permissions in your device\'s app settings.' },
};

const errorJazz = selector => errorInfo[selector];
const neverAskJazz = selector => neverAskRationale[selector];

const markPermissionRequest = perm => AsyncStorage.setItem(`Requested:${perm}`, 'true');
export const hasBeenRequested = perm => AsyncStorage.getItem(`Requested:${perm}`).then(response => !!response);


const deducePermissionGroup = (permissions, isDenied) => {
  if (permissions.reduce((pre, next) => `${pre} ${next}`).includes('Contacts')) {
    return isDenied ? deniedRationale.contacts : 'contacts';
  }

  return isDenied ? deniedRationale.attach : 'attach';
};

export const openSettingsIOS = () => {
  Linking.canOpenURL('app-settings:')
    .then((supported) => {
      if (supported) Linking.openURL('app-settings:');
    })
    .catch((error) => {
      logException(error, 'Permissions:openSettingsIOS', 'Trying to open app settings ma');
    });
};

export const showRationale = async (permission) => {
  if (isAtLeastMarshmallow) {
    try {
      const type = pTypes[permission];
      const requestedBefore = await hasBeenRequested(type);
      if (requestedBefore) {
        requestPermission(permission, true);
      } else {
        const { title, message } = rationale[permission];
        Alert.alert(title, message, [{ text: 'OK', onPress: () => requestPermission(permission) }]);
        markPermissionRequest(type);
      }
    } catch (error) {
      logException(error, 'Permissions:showRationale', permission);
    }
  }
};

const questionDenial = (permission, callback, isMultiRequest, isIOS) => {
  const { title, message } = isMultiRequest ? deducePermissionGroup(permission, true) : deniedRationale[permission];

  Alert.alert(
    title,
    message,
    [
      { text: 'CLOSE', onPress: () => {} },
      {
        text: 'GRANT',
        onPress: () => {
          if (isIOS) {
            openSettingsIOS();
          } else if (isMultiRequest) {
            requestMultiPermissions(permission, false, callback);
          } else {
            requestPermission(permission, false, callback);
          }
        },
      },
    ],
  );
};

const notifyActionFailure = (permission, isError, isMultiRequest, isIOS) => {
  const jazzSelector = isMultiRequest ? deducePermissionGroup(permission, false) : permission;

  const { title, message } = isError ? errorJazz(jazzSelector) : neverAskJazz(jazzSelector);
  Alert.alert(
    title,
    message,
    [
      { text: 'CLOSE', onPress: () => {} },
      // { text: 'SETTINGS', onPress: () => (isIOS ? openSettingsIOS() : OpenSettings.openSettings()) },
      { text: 'SETTINGS', onPress: () => (isIOS ? openSettingsIOS() : {}) },
    ],
  );
};

export const checkPermission = async (request) => {
  try {
    if (isAtLeastMarshmallow) {
      const permission = pTypes[request];
      return await PermissionsAndroid.check(permission);
    }

    return (true);
  } catch (error) {
    logException(error, 'Permissions:requestPermission', request);
    return (false);
  }
};

export const checkPermissionIOS = async (request, callback) => {
  try {
    if (callback && await Camera.checkVideoAuthorizationStatus()) {
      callback();
    } else {
      questionDenial(request, callback, false, true);
    }
  } catch (error) {
    notifyActionFailure(request, true, false, true);
    logException(error, 'Permissions:checkCameraPermissionIOS', request);
  }
};

export const checkMicrophoneAuthorisationStatus = async (request, callback) => {
  try {
    if (callback && await Camera.checkAudioAuthorizationStatus()) {
      callback();
    } else {
      questionDenial(request, callback, false, true);
    }
  } catch (error) {
    notifyActionFailure(request, true, false, true);
    logException(error, 'Permissions:checkMicrophoneAuthorisationStatus', request);
  }
};

// export const checkSpeechAuthorizationIOS = async (callback) => {
//   const request = 'speech';
//   try {
//     const hasSpeechRecognition = await Voice.isAvailable();
//     if (hasSpeechRecognition) {
//       checkMicrophoneAuthorisationStatus('audio', callback);
//     } else {
//       const speechStatus = await Voice.checkSpeechAuthorizationStatus();
//       if (callback && speechStatus === 'authorized') {
//         checkMicrophoneAuthorisationStatus('audio', callback);
//       } else if (speechStatus === 'denied' || speechStatus === 'restricted') {
//         questionDenial(request, callback, false, true);
//       } else {
//         const msgBody = 'Speech recognition is currently unavailable.';
//         Alert.alert('', msgBody, [{ text: 'OK', onPress: () => {}, style: 'cancel' }]);
//       }
//     }
//   } catch (error) {
//     notifyActionFailure(request, true, false, true);
//     logException(error, 'Permissions:checkSpeechAuthorizationIOS', request);
//   }
// };

export const requestPermissionConfig = async (config) => {
  const {
    request,
    grantedAction,
    deniedAction,
    showReason = true,
    showSettings = false,
  } = config;
  try {
    if (isAtLeastMarshmallow) {
      const permission = pTypes[request];
      const reason = showReason ? rationale[request] : null;
      const granted = await PermissionsAndroid.request(permission, reason);

      if (granted === PermissionsAndroid.RESULTS.GRANTED && grantedAction) {
        grantedAction();
      } else if (showReason || showSettings) {
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          if (showReason) questionDenial(request, grantedAction);
        } else if (showSettings) {
          // BackgroundGeolocation.showAppSettings();
        } else {
          notifyActionFailure(request, false);
        }
      } else if (deniedAction) {
        deniedAction();
      }
    } else if (grantedAction) {
      grantedAction();
    }
  } catch (error) {
    if (request !== 'sms') notifyActionFailure(request, true);
    logException(error, 'Permissions:requestPermission', request);
  }
};

export const requestPermission = async (request, showReason, callback) => {
  try {
    if (isAtLeastMarshmallow) {
      const permission = pTypes[request];
      const reason = showReason ? rationale[request] : null;
      const granted = await PermissionsAndroid.request(permission, reason);

      if (granted === PermissionsAndroid.RESULTS.GRANTED && callback) {
        callback();
      } else if (request !== 'sms') {
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          questionDenial(request, callback);
        } else {
          notifyActionFailure(request, false);
        }
      }
    } else if (callback) {
      callback();
    }
  } catch (error) {
    if (request !== 'sms') notifyActionFailure(request, true);
    logException(error, 'Permissions:requestPermission', request);
  }
};

export const requestMultiPermissions = async (request, showReason, callback) => {
  try {
    if (isAtLeastMarshmallow) {
      const permissions = request.map(name => pTypes[name]);
      const reason = showReason ? rationale.attach : null;
      const result = await PermissionsAndroid.requestMultiple(permissions, reason);

      const denied = (Object.values(result)).includes(PermissionsAndroid.RESULTS.DENIED);
      const never = (Object.values(result)).includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);

      if (never) {
        notifyActionFailure(request, false, true);
      } else if (denied) {
        questionDenial(request, callback, true);
      } else if (callback) {
        callback();
      }
    } else if (callback) {
      callback();
    }
  } catch (error) {
    notifyActionFailure(request, true, true);
    logException(error, 'Permissions:requestMultiPermissions', JSON.stringify(request));
  }
};
