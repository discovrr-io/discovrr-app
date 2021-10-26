import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { IconProps } from 'react-native-vector-icons/Icon';
import { color, font, layout } from 'src/constants';

import Spacer from '../Spacer';
import { CardElementProps } from './common';
import { useCardElementOptionsContext } from './hooks';

const INDICATOR_ICON_SMALL = 20;
const INDICATOR_ICON_LARGE = INDICATOR_ICON_SMALL * 1.25;

type VerticalPosition = 'top' | 'bottom';
type HorizontalPosition = 'left' | 'right';
type IndicatorPosition = `${VerticalPosition}-${HorizontalPosition}`;

type CardIndicatorProps = CardElementProps & {
  iconName: string;
  iconColor?: IconProps['color'];
  iconSize?: IconProps['size'];
  label?: string;
  labelColor?: TextStyle['color'];
  position?: IndicatorPosition;
};

const CardIndicator = (props: CardIndicatorProps) => {
  const {
    iconName,
    iconColor,
    iconSize,
    label,
    labelColor,
    position = 'top-right',
    elementOptions,
  } = props;

  const cardElementOptions = useCardElementOptionsContext(elementOptions);
  const inset = cardElementOptions.insetHorizontal;

  const positionStyle: ViewStyle = useMemo(
    () => ({
      top: position.includes('top') ? inset : undefined,
      bottom: position.includes('bottom') ? inset : undefined,
      left: position.includes('left') ? inset : undefined,
      right: position.includes('right') ? inset : undefined,
    }),
    [position, inset],
  );

  const containerStyle: ViewStyle = useMemo(
    () => ({
      paddingVertical: cardElementOptions.smallContent
        ? layout.spacing.xs
        : layout.spacing.sm,
      paddingHorizontal: cardElementOptions.smallContent
        ? layout.spacing.sm
        : layout.spacing.sm * 1.5,
      borderRadius: cardElementOptions.borderRadius,
    }),
    [cardElementOptions.borderRadius, cardElementOptions.smallContent],
  );

  return (
    <View
      style={[
        cardIndicatorStyles.container,
        containerStyle,
        positionStyle,
        props.style,
      ]}>
      <Icon
        name={iconName}
        color={iconColor ?? color.absoluteWhite}
        size={
          iconSize ?? cardElementOptions.smallContent
            ? INDICATOR_ICON_SMALL
            : INDICATOR_ICON_LARGE
        }
      />
      {label && (
        <>
          <Spacer.Horizontal
            value={
              cardElementOptions.smallContent
                ? layout.spacing.sm
                : layout.spacing.sm * 1.5
            }
          />
          <Text
            style={[
              cardElementOptions.smallContent ? font.smallBold : font.largeBold,
              { color: labelColor ?? color.white },
            ]}>
            {label}
          </Text>
        </>
      )}
    </View>
  );
};

const cardIndicatorStyles = StyleSheet.create({
  container: {
    zIndex: 10,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
});

export default CardIndicator;
