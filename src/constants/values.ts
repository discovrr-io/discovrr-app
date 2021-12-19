import { Animation } from 'react-native-animatable';
import { getVersion } from 'react-native-device-info';
import { spacing } from './layout';

const nodePackage = require('../../package.json');

export const DEFAULT_ACTIVE_OPACITY = 0.75;
export const DEFAULT_TILE_SPACING = spacing.sm * 1.1;
export const DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT = 56;
export const DEFAULT_ICON_LIKE_ANIMATION: Animation = 'rubberBand';

export const MAX_VID_DURATION_SECONDS = 60;
export const MAX_VID_DURATION_MILLISECONDS = MAX_VID_DURATION_SECONDS * 1000;

export const BOTTOM_SHEET_WAIT_DURATION = 80;

export const IOS_APP_STORE_LINK =
  'https://apps.apple.com/au/app/discovrr/id1541137819';
export const ANDROID_PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=com.discovrr.discovrr_app';

export const APP_VERSION: string =
  nodePackage.version || `${getVersion()}-native` || '<unknown-version>';

// Store version 3.0.0.13 (3000013)
export const STORE_VERSION = createVersionString([3, 0, 0, 13] as const);
// Set this to the appropriate option any time the `STORE_VERSION` is changed
export const STORE_SHOULD_SIGN_OUT = true;

function createVersionString(
  version: readonly [number, number, number, number],
): string {
  const [major, minor, patch, build] = version;
  return String(
    major * 1e6 + (minor % 100) * 1e4 + (patch % 100) * 1e2 + (build % 100),
  );
}
