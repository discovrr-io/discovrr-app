import React, { useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import { IconProps } from 'react-native-vector-icons/Icon';

import * as constants from 'src/constants';
import * as values from 'src/constants/values';
import * as utilities from 'src/utilities';
import { useExtendedTheme } from 'src/hooks';

import * as cardConstants from './constants';
import Spacer from '../Spacer';
import { CardElementProps } from './common';
import { useCardElementOptionsContext } from './hooks';

export type CardActionsProps = CardElementProps & {
  itemSpacing?: number;
  children?: React.ReactNode;
};

const CardActions = (props: CardActionsProps) => {
  const cardElementOptions = useCardElementOptionsContext(props.elementOptions);

  return (
    <View
      style={[
        cardActionsStyles.cardContainer,
        {
          height: cardElementOptions.smallContent
            ? cardConstants.CARD_ICON_SMALL
            : cardConstants.CARD_ICON_LARGE,
        },
        props.style,
      ]}>
      {React.Children.toArray(props.children)
        .filter(Boolean)
        .map((child, index, children) => (
          <View
            key={`card-action-item-${index}`}
            style={{ flexDirection: 'row', alignItems: 'center' }}>
            {index < children.length - 1 && (
              <Spacer.Horizontal
                value={
                  props.itemSpacing ?? cardElementOptions.insetHorizontal * 0.75
                }
              />
            )}
            {child}
          </View>
        ))}
    </View>
  );
};

const cardActionsStyles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  cardIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export type CardActionsPendingProps = CardElementProps & {
  numberOfActions?: number;
  itemSpacing?: number;
};

const CardActionsPending = (props: CardActionsPendingProps) => {
  const cardElementOptions = useCardElementOptionsContext(props.elementOptions);
  const { colors } = useExtendedTheme();

  const numberOfActions = props.numberOfActions ?? 1;
  const iconSize = cardElementOptions.smallContent
    ? cardConstants.CARD_PLACEHOLDER_ICON_HEIGHT_SMALL
    : cardConstants.CARD_PLACEHOLDER_ICON_HEIGHT_LARGE;

  return (
    <View style={[cardActionsStyles.cardContainer, props.style]}>
      {[...Array(numberOfActions)].map((_, index) => (
        <View
          key={`card-actions-icon-placeholder-${index}`}
          style={{ flexDirection: 'row' }}>
          <View
            style={{
              width: iconSize,
              height: iconSize,
              backgroundColor: colors.placeholder,
            }}
          />
          {index < numberOfActions - 1 && (
            <Spacer.Horizontal
              value={
                props.itemSpacing ?? cardElementOptions.insetHorizontal * 0.75
              }
            />
          )}
        </View>
      ))}
    </View>
  );
};

CardActions.Pending = CardActionsPending;

type AnimatableViewRef = Animatable.View & View;

type CardActionsIconButtonProps = CardElementProps &
  TouchableOpacityProps & {
    iconName: string;
    iconColor?: IconProps['color'];
    iconSize?: IconProps['size'] | ((size: number) => number);
    label?: string;
    labelColor?: TextStyle['color'];
  };

export const CardActionsIconButton = React.forwardRef<
  AnimatableViewRef,
  CardActionsIconButtonProps
>((props: CardActionsIconButtonProps, ref) => {
  const {
    iconName,
    iconColor,
    iconSize,
    label,
    labelColor,
    elementOptions,
    style,
    ...restProps
  } = props;

  const cardElementOptions = useCardElementOptionsContext(elementOptions);
  const { colors } = useExtendedTheme();

  const cardIconSize = useMemo(() => {
    return cardElementOptions.smallContent
      ? cardConstants.CARD_ICON_SMALL
      : cardConstants.CARD_ICON_LARGE;
  }, [cardElementOptions.smallContent]);

  return (
    <TouchableOpacity
      {...restProps}
      disabled={cardElementOptions.disabled}
      activeOpacity={restProps.activeOpacity ?? values.DEFAULT_ACTIVE_OPACITY}
      style={[cardActionsStyles.cardIconContainer, style]}>
      <Animatable.View ref={ref}>
        <Icon
          name={iconName}
          color={iconColor ?? colors.caption}
          size={
            typeof iconSize === 'function'
              ? iconSize(cardIconSize)
              : iconSize ?? cardIconSize
          }
        />
      </Animatable.View>
      {label && (
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[
            cardElementOptions.captionTextStyle,
            {
              textAlign: 'right',
              color: labelColor ?? colors.caption,
              minWidth: cardElementOptions.smallContent ? 10 : 14,
            },
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
});

type CardActionsToggleIconButtonCallback<T> = (toggleState: boolean) => T;

type CardActionsToggleIconButtonProps = CardElementProps & {
  initialValue?: boolean;
  iconName: CardActionsToggleIconButtonCallback<string>;
  iconColor?: CardActionsToggleIconButtonCallback<IconProps['color']>;
  iconSize?: CardActionsToggleIconButtonCallback<IconProps['size']>;
  label?: CardActionsToggleIconButtonCallback<string>;
  labelColor?: CardActionsToggleIconButtonCallback<TextStyle['color']>;
  onToggle?: CardActionsToggleIconButtonCallback<void | Promise<void>>;
};

export const CardActionsToggleIconButton = React.forwardRef<
  AnimatableViewRef,
  CardActionsToggleIconButtonProps
>((props: CardActionsToggleIconButtonProps, ref) => {
  const {
    initialValue,
    iconName: makeIconName,
    iconColor: makeIconColor,
    iconSize: makeIconSize,
    label: makeLabel,
    labelColor: makeLabelColor,
    onToggle,
    ...restProps
  } = props;

  const [toggleState, setToggleState] = useState(initialValue ?? false);

  const handleToggle = async () => {
    const newState = !toggleState;
    try {
      setToggleState(newState);
      await onToggle?.(newState);
    } catch (error) {
      setToggleState(!newState);
      console.warn(`Toggling button back to ${toggleState}:`, error);
      throw error;
    }
  };

  return (
    <CardActionsIconButton
      ref={ref}
      iconName={makeIconName(toggleState)}
      iconColor={makeIconColor?.(toggleState)}
      iconSize={makeIconSize?.(toggleState)}
      label={makeLabel?.(toggleState)}
      labelColor={makeLabelColor?.(toggleState)}
      onPress={handleToggle}
      {...restProps}
    />
  );
});

type CardActionsHeartIconButtonProps = CardElementProps & {
  didLike: boolean;
  totalLikes: number;
  onToggleLike: (didLike: boolean) => void | Promise<void>;
};

export const CardActionsHeartIconButton = (
  props: CardActionsHeartIconButtonProps,
) => {
  const { didLike, totalLikes, onToggleLike, ...restProps } = props;
  const { colors } = useExtendedTheme();
  const animatableRef = useRef<AnimatableViewRef>(null);

  const handleToggleLike = async () => {
    if (!didLike) {
      // Imperative approach to only animate this if the icon has been pressed
      animatableRef.current?.[values.DEFAULT_ICON_LIKE_ANIMATION]?.();
    }

    await onToggleLike(!didLike);
  };

  return (
    <CardActionsIconButton
      ref={animatableRef}
      iconName={didLike ? 'heart' : 'heart-outline'}
      iconColor={didLike ? constants.color.red500 : undefined}
      label={
        totalLikes > 0 ? utilities.shortenLargeNumber(totalLikes) : undefined
      }
      labelColor={didLike ? colors.text : undefined}
      onPress={handleToggleLike}
      {...restProps}
    />
  );
};

// CardActionsIconButton.displayName = 'CardActionsIconButton';
// CardActionsToggleIconButton.displayName = 'CardActionsToggleIconButton';

export default CardActions;
