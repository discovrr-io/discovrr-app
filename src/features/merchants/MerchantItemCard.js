import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { useIsMounted } from '../../hooks';
import { DEFAULT_AVATAR, DEFAULT_IMAGE } from '../../constants/media';

import {
  colors,
  DEFAULT_ACTIVE_OPACITY,
  typography,
  values,
} from '../../constants';

import { useSelector } from 'react-redux';
import { selectMerchantById } from './merchantsSlice';

const SMALL_ICON = 24;

/**
 * @typedef {import('../../models').MerchantId} MerchantId
 * @typedef {{ merchantId: MerchantId }} MerchantItemCardProps
 * @typedef {import('react-native').ViewProps} ViewProps
 *
 * @param {MerchantItemCardProps & ViewProps} param0
 */
export default function MerchantItemCard({ merchantId, ...props }) {
  const navigation = useNavigation();

  const merchant = useSelector((state) =>
    selectMerchantById(state, merchantId),
  );
  if (!merchant) {
    console.warn(
      '[MerchantItemCard] Failed to select merchant with id:',
      merchantId,
    );
    return null;
  }

  /** @type {import('../../models/common').ImageSource} */
  const coverPhoto = merchant.coverPhoto ?? DEFAULT_IMAGE;

  const isMounted = useIsMounted();
  const [imageDimensions, setImageDimensions] = useState(null);

  return (
    <View style={props.style}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={() =>
          navigation.navigate('MerchantProfileScreen', {
            merchant,
            merchantShortName: merchant.shortName,
          })
        }>
        <View
          style={{
            position: 'absolute',
            zIndex: 1,
            top: values.spacing.sm * 1.25,
            right: values.spacing.sm * 1.25,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            padding: values.spacing.sm,
            borderRadius: 20,
          }}>
          <Icon name="storefront" color={colors.white} size={20} />
        </View>
        <View>
          <View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                justifyContent: 'center',
              },
              merchantItemCardStyles.imageContainer,
            ]}>
            <ActivityIndicator size="large" color={colors.gray500} />
          </View>
          <Image
            source={coverPhoto}
            resizeMode="cover"
            onLoad={(event) => {
              const { height, width } = event.nativeEvent.source;
              if (isMounted.current) setImageDimensions({ height, width });
            }}
            style={[
              {
                aspectRatio: imageDimensions
                  ? imageDimensions.width / imageDimensions.height
                  : 1,
                opacity: imageDimensions ? 1 : 0,
              },
              merchantItemCardStyles.imageContainer,
            ]}
          />
        </View>
        <MerchantItemCardCaption merchant={merchant} />
      </TouchableOpacity>
      <MerchantItemCardFooter merchant={merchant} />
    </View>
  );
}

const merchantItemCardStyles = StyleSheet.create({
  imageContainer: {
    borderWidth: values.border.thin,
    borderRadius: values.radius.md,
    borderColor: colors.gray300,
    backgroundColor: colors.gray100,
  },
});

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @param {{ merchant: Merchant }} param0
 * @returns
 */
function MerchantItemCardCaption({ merchant }) {
  const { description, __distanceToDefaultPoint } = merchant;
  return (
    <View
      style={{
        marginTop: values.spacing.sm,
        marginHorizontal: values.spacing.sm,
      }}>
      <Text numberOfLines={2} style={merchantItemCardCaptionStyles.caption}>
        {description}
      </Text>
      {__distanceToDefaultPoint && (
        <Text
          style={[
            merchantItemCardCaptionStyles.caption,
            { color: colors.gray700, marginTop: values.spacing.sm },
          ]}>
          {(__distanceToDefaultPoint / 1).toFixed(1)}km away
        </Text>
      )}
    </View>
  );
}

const merchantItemCardCaptionStyles = StyleSheet.create({
  caption: {
    color: colors.black,
    fontSize: typography.size.sm,
  },
});

/**
 * @param {{ merchant: Merchant }} param0
 */
function MerchantItemCardFooter({ merchant }) {
  const { avatar, shortName, statistics } = merchant;
  const { didSave = false, didLike = false, totalLikes = 0 } = statistics ?? {};

  return (
    <View style={merchantItemCardFooterStyles.container}>
      <View style={merchantItemCardFooterStyles.merchantContainer}>
        <FastImage
          source={avatar ?? DEFAULT_AVATAR}
          style={{
            width: SMALL_ICON,
            height: SMALL_ICON,
            borderRadius: SMALL_ICON / 2,
          }}
        />
        <Text style={merchantItemCardFooterStyles.merchantName}>
          {shortName}
        </Text>
      </View>
      <View style={merchantItemCardFooterStyles.actionsContainer}>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={() => {}}>
          <Icon
            name={didSave ? 'bookmark' : 'bookmark-outline'}
            color={didSave ? colors.black : colors.gray}
            size={SMALL_ICON}
            style={{ marginRight: values.spacing.sm }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={() => {}}>
          <Animatable.View key={didLike.toString()} animation="bounceIn">
            <Icon
              name={didLike ? 'favorite' : 'favorite-border'}
              color={didLike ? colors.red500 : colors.gray}
              size={SMALL_ICON}
            />
          </Animatable.View>
        </TouchableOpacity>
        <Text
          style={[
            merchantItemCardFooterStyles.likesCount,
            {
              fontSize: typography.size.xs,
            },
          ]}>
          {totalLikes > 999 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}
        </Text>
      </View>
    </View>
  );
}

const merchantItemCardFooterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: values.spacing.sm,
    marginHorizontal: values.spacing.sm,
  },
  merchantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantName: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: values.spacing.sm * 1.5,
    color: colors.black,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesCount: {
    marginLeft: values.spacing.xxs,
    alignSelf: 'flex-end',
  },
});
