import {
  Dimensions,
  PixelRatio,
  Platform,
} from 'react-native';

// import DeviceInfo from 'react-native-device-info';

import {
  getCorrectFontSizeForScreen,
} from './PixelDensitySupport';

export const noNetwork = 'Network request failed';

export const isAndroid = Platform.OS === 'android';
export const isAtLeastLollipop = Platform.Version > 20;
// export const isTallIphone = DeviceInfo.getModel().includes('iPhone X');
const imageDimension = (!isAndroid || isAtLeastLollipop) ? 2000 : 1200;
export const windowWidth = Dimensions.get('window').width;
export const windowHeight = Dimensions.get('window').height;
export const majorVersionIOS = isAndroid ? 0 : parseInt(Platform.Version, 10);

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const titleSize = getCorrectFontSizeForScreen(PixelRatio, windowWidth, windowHeight, 10) < 13 ? 16 : 20;
export const titleSizeSmall = getCorrectFontSizeForScreen(PixelRatio, windowWidth, windowHeight, 10) < 13 ? 14 : 18;
export const imageOptions = { quality: 0.7, maxWidth: 960, maxHeight: 720, noData: true };
export const imageOptionsHQ = { quality: 0.9, maxWidth: imageDimension, maxHeight: imageDimension, noData: true };
export const largeImageHeight = windowHeight * 0.31;
export const largeImageHeightPromo = windowHeight * 0.35;
export const regionPickerTextWidth = windowWidth - 110;
export const chartDimensions = { height: windowHeight * 0.38, radius: (windowHeight * 0.33) / 2 };
export const appDrawerWidth = windowWidth * 0.69;
export const drawerAvatar = { width: windowWidth * 0.39, borderRadius: (windowWidth * 0.39) / 2 };
