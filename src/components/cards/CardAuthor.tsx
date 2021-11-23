import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { MediaSource } from 'src/api';
import { color, font } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';

import * as constants from './constants';
import Spacer from '../Spacer';
import { useCardElementOptionsContext } from './hooks';

import {
  CardElementOptions,
  CardElementProps,
  CardElementChildRenderer,
} from './common';

//#region CardAuthorWrapper ----------------------------------------------------

type CardAuthorWrapperProps = CardElementProps &
  Pick<TouchableOpacityProps, 'onPress'> & {
    renderAvatar: CardElementChildRenderer;
    renderName: CardElementChildRenderer;
  };

const CardAuthorWrapper = (props: CardAuthorWrapperProps) => {
  const cardElementOptions = useCardElementOptionsContext(props.elementOptions);
  return (
    <TouchableOpacity
      {...props}
      disabled={cardElementOptions.disabled}
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      style={[cardAuthorStyles.container, props.style]}>
      {props.renderAvatar(cardElementOptions)}
      <Spacer.Horizontal
        value={
          cardElementOptions.smallContent
            ? constants.CARD_INSET_HORIZONTAL_SMALL
            : constants.CARD_INSET_HORIZONTAL_LARGE
        }
      />
      {props.renderName(cardElementOptions)}
    </TouchableOpacity>
  );
};

//#endregion CardAuthorWrapper

//#region CardAuthor -----------------------------------------------------------

export type CardAuthorProps = CardElementProps & {
  displayName: string | undefined;
  isMyProfile?: boolean;
  avatar?: MediaSource | null;
  onPress?: TouchableOpacityProps['onPress'];
};

const CardAuthor = (props: CardAuthorProps) => {
  const cardElementOptions = useCardElementOptionsContext(props.elementOptions);
  return (
    <CardAuthorWrapper
      elementOptions={cardElementOptions}
      onPress={props.onPress}
      style={props.style}
      renderAvatar={elementOptions => (
        <CardAuthorAvatar
          avatar={props.avatar}
          elementOptions={elementOptions}
        />
      )}
      renderName={elementOptions => (
        <CardAuthorName
          displayName={props.displayName}
          isMyProfile={props.isMyProfile}
          elementOptions={elementOptions}
        />
      )}
    />
  );
};

export type CardAuthorPendingProps = CardElementProps;

const CardAuthorPending = (props: CardAuthorPendingProps) => (
  <CardAuthorWrapper
    elementOptions={props.elementOptions}
    style={props.style}
    renderAvatar={elementOptions => (
      <CardAuthorAvatar.Pending elementOptions={elementOptions} />
    )}
    renderName={elementOptions => (
      <CardAuthorName.Pending elementOptions={elementOptions} />
    )}
  />
);

//#endregion CardAuthor

//#region CardAuthorAvatar -----------------------------------------------------

type CardAuthorAvatarProps = {
  avatar?: MediaSource | null;
  elementOptions: CardElementOptions;
};

const CardAuthorAvatar = (props: CardAuthorAvatarProps) => {
  const avatarDiameter = props.elementOptions.smallContent
    ? constants.CARD_ICON_SMALL
    : constants.CARD_ICON_LARGE;
  return (
    <FastImage
      source={props.avatar ? { uri: props.avatar.url } : DEFAULT_AVATAR}
      style={[
        cardAuthorStyles.avatar,
        { width: avatarDiameter, borderRadius: avatarDiameter / 2 },
      ]}
    />
  );
};

// eslint-disable-next-line react/display-name
CardAuthorAvatar.Pending = (props: CardElementProps) => {
  const avatarDiameter = props.elementOptions?.smallContent
    ? constants.CARD_ICON_SMALL
    : constants.CARD_ICON_LARGE;
  return (
    <FastImage
      source={{}} // No image - this'll just render the background color
      style={[
        cardAuthorStyles.avatar,
        { width: avatarDiameter, borderRadius: avatarDiameter / 2 },
      ]}
    />
  );
};

//#endregion CardAuthorAvatar

//#region CardAuthorName -------------------------------------------------------

type CardAuthorNameProps = {
  displayName: string | undefined;
  elementOptions: CardElementOptions;
  isMyProfile?: boolean;
};

const CardAuthorName = (props: CardAuthorNameProps) => (
  <Text
    numberOfLines={1}
    style={[
      cardAuthorStyles.displayName,
      props.elementOptions.captionTextStyle,
      props.isMyProfile && [
        { fontFamily: font.FONT_FAMILY_MEDIUM, color: color.accent },
      ],
    ]}>
    {props.isMyProfile ? 'You' : props.displayName || 'Anonymous'}
  </Text>
);

type CardAuthorNamePendingProps = {
  elementOptions: CardElementOptions;
};

const CardAuthorNamePending = (props: CardAuthorNamePendingProps) => (
  <View
    style={[
      {
        width: '60%',
        height: props.elementOptions.smallContent
          ? constants.CARD_PLACEHOLDER_TEXT_HEIGHT_SMALL
          : constants.CARD_PLACEHOLDER_TEXT_HEIGHT_LARGE,
        backgroundColor: color.placeholder,
      },
    ]}
  />
);

//#endregion CardAuthorName

//#region Styles ---------------------------------------------------------------

const cardAuthorStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    aspectRatio: 1,
    backgroundColor: color.placeholder,
  },
  displayName: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

//#endregion Styles

CardAuthor.Pending = CardAuthorPending;
CardAuthorName.Pending = CardAuthorNamePending;

export default CardAuthor;
