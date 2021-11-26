import { Animation } from 'react-native-animatable';
import { getVersion } from 'react-native-device-info';
import { spacing } from './layout';

const nodePackage = require('../../package.json');

export const DEFAULT_ACTIVE_OPACITY = 0.75;
export const DEFAULT_TILE_SPACING = spacing.sm * 1.1;
export const DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT = 55;
export const DEFAULT_ICON_LIKE_ANIMATION: Animation = 'rubberBand';

export const MAX_VID_DURATION_SECONDS = 60;
export const MAX_VID_DURATION_MILLISECONDS = MAX_VID_DURATION_SECONDS * 1000;

export const MAX_FONT_MULTIPLIER = 1.5;

export const APP_VERSION: string =
  nodePackage.version || `${getVersion()}-native` || '<unknown-version>';

// Store version 3.0.0.10 (3000010)
export const STORE_VERSION = createVersionString([3, 0, 0, 10] as const);
// Set this to the appropriate option any time the `STORE_VERSION` is changed
export const STORE_SHOULD_SIGN_OUT = false;

function createVersionString(
  version: readonly [number, number, number, number],
): string {
  const [major, minor, patch, build] = version;
  return String(
    major * 1e6 + (minor % 100) * 1e4 + (patch % 100) * 1e2 + (build % 100),
  );
}
