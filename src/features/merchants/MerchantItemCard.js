import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import analytics from '@react-native-firebase/analytics';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { FEATURE_UNAVAILABLE } from '../../constants/strings';
import { useAppDispatch, useAppSelector, useIsMounted } from '../../hooks';
import { DEFAULT_AVATAR, DEFAULT_IMAGE } from '../../constants/media';

import {
  colors,
  DEFAULT_ACTIVE_OPACITY,
  typography,
  values,
} from '../../constants';

import { changeMerchantLikeStatus, selectMerchantById } from './merchantsSlice';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const SMALL_ICON = 24;

const alertUnimplementedFeature = () => {
  Alert.alert(FEATURE_UNAVAILABLE.title, FEATURE_UNAVAILABLE.message);
};

/**
 * @typedef {import('../../models').MerchantId} MerchantId
 * @typedef {{ merchantId: MerchantId, displayedOnNearMeTab?: boolean }} MerchantItemCardProps
 * @typedef {import('react-native').ViewProps} ViewProps
 *
 * @param {MerchantItemCardProps & ViewProps} param0
 */
export default function MerchantItemCard({
  merchantId,
  displayedOnNearMeTab = false, // For analytics purposes
  ...props
}) {
  const $FUNC = '[MerchantItemCard]';
  const navigation = useNavigation();

  const merchant = useAppSelector((state) =>
    selectMerchantById(state, merchantId),
  );

  const isMounted = useIsMounted();
  const [imageDimensions, setImageDimensions] = useState(null);

  if (!merchant) {
    console.warn($FUNC, 'Failed to select merchant with id:', merchantId);
    return null;
  }

  /** @type {import('../../models/common').ImageSource} */
  const coverPhoto = merchant.coverPhoto ?? DEFAULT_IMAGE;

  return (
    <View style={props.style}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={() =>
          navigation.navigate('MerchantProfileScreen', {
            merchantId,
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
      <MerchantItemCardFooter
        merchantId={merchantId}
        displayedOnNearMeTab={displayedOnNearMeTab}
      />
    </View>
  );
}

const merchantItemCardStyles = StyleSheet.create({
  imageContainer: {
    // borderWidth: values.border.thin,
    // borderColor: colors.gray300,
    borderRadius: values.radius.md,
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
    fontSize: typography.size.xs + 1,
  },
});

/**
 * @typedef {import('../../models').MerchantId} MerchantId
 * @param {{ merchantId: MerchantId, displayedOnNearMeTab?: boolean }} param0
 */
export function MerchantItemCardFooter({
  merchantId,
  displayedOnNearMeTab = false, // For analytics purposes
}) {
  const $FUNC = '[MerchantItemCardFooter]';
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const merchant = useAppSelector((state) =>
    selectMerchantById(state, merchantId),
  );

  // if (!merchant) {
  //   console.warn($FUNC, 'Failed to select merchant with id:', merchantId);
  //   return null;
  // }

  const { avatar, shortName = 'Loading...', statistics } = merchant ?? {};
  const { didSave = false, didLike = false, totalLikes = 0 } = statistics ?? {};

  const [isProcessingLike, setIsProcessingLike] = useState(false);

  const handlePressLike = async () => {
    try {
      setIsProcessingLike(true);

      const newDidLike = !didLike;
      console.log($FUNC, `Will ${newDidLike ? 'like' : 'unlike'} merchant...`);

      await dispatch(
        changeMerchantLikeStatus({
          merchantId: merchant.id,
          didLike: newDidLike,
        }),
      ).unwrap();

      if (newDidLike) {
        try {
          await analytics().logEvent('like_merchant', {
            merchant_id: merchant.id,
            merchant_name: merchant.shortName,
            from_near_me_tab: displayedOnNearMeTab,
          });
        } catch (error) {
          console.error($FUNC, 'Failed to send `like_merchant` event:', error);
        }
      }
    } catch (error) {
      console.error($FUNC, 'Failed to change merchant like status:', error);
      Alert.alert(SOMETHING_WENT_WRONG.title, SOMETHING_WENT_WRONG.message);
    } finally {
      setIsProcessingLike(false);
    }
  };

  return (
    <View style={merchantItemCardFooterStyles.container}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={() =>
          navigation.navigate('MerchantProfileScreen', {
            merchantId,
            merchantShortName: shortName,
          })
        }
        style={{ flex: 1 }}>
        <View style={merchantItemCardFooterStyles.merchantContainer}>
          <Image
            source={avatar ?? DEFAULT_AVATAR}
            style={{
              width: SMALL_ICON,
              height: SMALL_ICON,
              borderRadius: SMALL_ICON / 2,
              backgroundColor: colors.gray100,
            }}
          />
          <Text
            numberOfLines={1}
            style={merchantItemCardFooterStyles.merchantName}>
            {shortName}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={merchantItemCardFooterStyles.actionsContainer}>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={alertUnimplementedFeature}>
          <Icon
            name={didSave ? 'bookmark' : 'bookmark-outline'}
            color={didSave ? colors.black : colors.gray}
            size={SMALL_ICON}
            style={{ marginRight: values.spacing.sm }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isProcessingLike}
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={handlePressLike}>
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
