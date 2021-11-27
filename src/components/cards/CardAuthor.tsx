import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import * as globalConstants from 'src/constants';
import { MediaSource } from 'src/api';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { useExtendedTheme } from 'src/hooks';
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

  const { colors } = useExtendedTheme();

  return (
    <FastImage
      source={props.avatar ? { uri: props.avatar.url } : DEFAULT_AVATAR}
      style={[
        cardAuthorStyles.avatar,
        {
          width: avatarDiameter,
          borderRadius: avatarDiameter / 2,
          backgroundColor: colors.placeholder,
        },
      ]}
    />
  );
};

CardAuthorAvatar.Pending = (props: CardElementProps) => {
  const avatarDiameter = props.elementOptions?.smallContent
    ? constants.CARD_ICON_SMALL
    : constants.CARD_ICON_LARGE;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();

  return (
    <FastImage
      source={{}} // No image - this'll just render the background color
      style={[
        cardAuthorStyles.avatar,
        {
          width: avatarDiameter,
          borderRadius: avatarDiameter / 2,
          backgroundColor: colors.placeholder,
        },
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

const CardAuthorName = (props: CardAuthorNameProps) => {
  const { colors } = useExtendedTheme();
  return (
    <Text
      numberOfLines={1}
      style={[
        cardAuthorStyles.displayName,
        props.elementOptions.captionTextStyle,
        { color: colors.text },
        props.isMyProfile && {
          fontFamily: globalConstants.font.FONT_FAMILY_MEDIUM,
          color: colors.primary,
        },
        ,
      ]}>
      {props.isMyProfile ? 'You' : props.displayName || 'Anonymous'}
    </Text>
  );
};

type CardAuthorNamePendingProps = {
  elementOptions: CardElementOptions;
};

function CardAuthorNamePending(props: CardAuthorNamePendingProps) {
  const { colors } = useExtendedTheme();
  return (
    <View
      style={[
        {
          width: '60%',
          height: props.elementOptions.smallContent
            ? constants.CARD_PLACEHOLDER_TEXT_HEIGHT_SMALL
            : constants.CARD_PLACEHOLDER_TEXT_HEIGHT_LARGE,
          backgroundColor: colors.placeholder,
        },
      ]}
    />
  );
}

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
