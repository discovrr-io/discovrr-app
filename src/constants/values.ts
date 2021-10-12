import { getVersion } from 'react-native-device-info';
import { spacing } from './layout';

export const DEFAULT_ACTIVE_OPACITY = 0.75;
export const DEFAULT_TILE_SPACING = spacing.sm * 1.1;
export const DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT = 55;

export const DEFAULT_ICON_LIKE_ANIMATION = 'tada';

export const APP_VERSION = `${getVersion()}.3`;
export const APP_BUILD = '2021.10.12.00';
