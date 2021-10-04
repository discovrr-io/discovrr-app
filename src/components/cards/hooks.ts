import { useMemo } from 'react';

import { font } from 'src/constants';
import { useOverridableContextOptions } from 'src/hooks';
import * as constants from './constants';

import {
  CardElementOptions,
  CardElementOptionsContext,
  CardElementProps,
} from './common';

export function useCardElementOptionsContext(
  overrides?: CardElementProps['elementOptions'],
): CardElementOptions {
  const newOverrides = useMemo(() => {
    if (!overrides) return undefined;
    const _newOverrides = overrides;

    if (!_newOverrides.insetHorizontal) {
      _newOverrides.insetHorizontal = _newOverrides.smallContent
        ? constants.CARD_INSET_HORIZONTAL_SMALL
        : constants.CARD_INSET_HORIZONTAL_LARGE;
    }

    if (!_newOverrides.insetVertical) {
      _newOverrides.insetVertical = _newOverrides.smallContent
        ? constants.CARD_INSET_VERTICAL_SMALL
        : constants.CARD_INSET_VERTICAL_LARGE;
    }

    if (!_newOverrides.borderRadius) {
      _newOverrides.borderRadius = _newOverrides.smallContent
        ? constants.CARD_BORDER_RADIUS_SMALL
        : constants.CARD_BORDER_RADIUS_LARGE;
    }

    if (!_newOverrides.captionTextStyle) {
      _newOverrides.captionTextStyle = _newOverrides.smallContent
        ? font.small
        : font.large;
    }

    return _newOverrides;
  }, [overrides]);

  return useOverridableContextOptions(CardElementOptionsContext, newOverrides);
}
