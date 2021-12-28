import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { font } from 'src/constants';
import * as constants from './constants';

export type CardElementChildRenderer = (
  elementOptions: CardElementOptions,
) => React.ReactNode;

export type CardElementOptions = {
  disabled: boolean;
  smallContent: boolean;
  insetHorizontal: number;
  insetVertical: number;
  borderRadius: number;
  captionTextStyle: TextStyle;
};

export type CardElementProps = {
  elementOptions?: Partial<CardElementOptions>;
  style?: StyleProp<ViewStyle>;
};

export const defaultCardElementOptions: CardElementOptions = {
  disabled: false,
  smallContent: false,
  insetHorizontal: constants.CARD_INSET_HORIZONTAL_LARGE,
  insetVertical: constants.CARD_INSET_HORIZONTAL_LARGE,
  borderRadius: constants.CARD_BORDER_RADIUS_LARGE,
  captionTextStyle: font.large,
};

export const CardElementOptionsContext =
  React.createContext<CardElementOptions>(defaultCardElementOptions);
