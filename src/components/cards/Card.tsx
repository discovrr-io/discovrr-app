import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { color, font } from 'src/constants';

import * as constants from './constants';
import CardAuthor from './CardAuthor';
import CardBody from './CardBody';
import CardFooter from './CardFooter';
import CardIndicator, { CardIndicatorRow } from './CardIndicator';

import CardActions, {
  CardActionsHeartIconButton,
  CardActionsIconButton,
  CardActionsToggleIconButton,
} from './CardActions';

import {
  CardElementOptions,
  CardElementOptionsContext,
  CardElementProps,
  defaultCardElementOptions,
} from './common';

type CardProps = CardElementProps & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const Card = (props: CardProps) => {
  const { elementOptions, children, style } = props;

  const cardElementOptions = useMemo(
    () => ({
      ...defaultCardElementOptions,
      ...elementOptions,
      ...({
        insetHorizontal:
          !elementOptions?.insetHorizontal && elementOptions?.smallContent
            ? constants.CARD_INSET_HORIZONTAL_SMALL
            : constants.CARD_INSET_HORIZONTAL_LARGE,
        insetVertical:
          !elementOptions?.insetVertical && elementOptions?.smallContent
            ? constants.CARD_INSET_VERTICAL_SMALL
            : constants.CARD_INSET_VERTICAL_LARGE,
        borderRadius:
          !elementOptions?.borderRadius && elementOptions?.smallContent
            ? constants.CARD_BORDER_RADIUS_SMALL
            : constants.CARD_BORDER_RADIUS_LARGE,
        captionTextStyle:
          !elementOptions?.captionTextStyle && elementOptions?.smallContent
            ? font.small
            : font.large,
      } as Partial<CardElementOptions>),
    }),
    [elementOptions],
  );

  return (
    <CardElementOptionsContext.Provider value={cardElementOptions}>
      <View
        style={[
          cardStyles.container,
          { borderRadius: cardElementOptions.borderRadius },
          style,
        ]}>
        {children}
      </View>
    </CardElementOptionsContext.Provider>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: color.absoluteWhite,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.gray200,
    overflow: 'hidden',
  },
});

Card.Actions = CardActions;
Card.Author = CardAuthor;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.IconButton = CardActionsIconButton;
Card.HeartIconButton = CardActionsHeartIconButton;
Card.Indicator = CardIndicator;
Card.IndicatorRow = CardIndicatorRow;
Card.ToggleIconButton = CardActionsToggleIconButton;

export default Card;
