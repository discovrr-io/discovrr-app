import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { DEFAULT_IMAGE, DEFAULT_IMAGE_DIMENSIONS } from '../../constants/media';

import {
  colors,
  DEFAULT_ACTIVE_OPACITY,
  typography,
  values,
} from '../../constants';

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @typedef {import('../../models/common').ImageSource} ImageSource
 * @typedef {{width: number, height: number }} ImageDimensions
 *
 * @typedef {{ merchant: Merchant, imageSource: ImageSource, imageDimensions: ImageDimensions }} MerchantItemCardProps
 * @typedef {import('react-native').ViewProps} ViewProps
 *
 * @param {MerchantItemCardProps & ViewProps} param0
 */
export default function MerchantItemCard({
  merchant,
  imageSource,
  imageDimensions,
  ...props
}) {
  const navigation = useNavigation();

  return (
    <View style={[props.style]}>
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
          <Icon
            name="storefront"
            color={
              __DEV__ && merchant.__hasCompleteProfile
                ? colors.yellow500
                : colors.white
            }
            size={20}
          />
        </View>
        <Image
          source={imageSource}
          resizeMode="cover"
          width={imageDimensions.width}
          height={imageDimensions.height}
          style={[
            {
              width: imageDimensions.width,
              height: imageDimensions.height,
            },
            merchantItemCardStyles.imageContainer,
          ]}
        />
      </TouchableOpacity>
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
 * @param {{ merchant: Merchant }} param0
 * @returns
 */
export function MerchantItemCardFooter({ merchant }) {
  const { shortName, __distanceToDefaultPoint } = merchant;
  return (
    <View
      style={{
        marginTop: values.spacing.sm,
        marginHorizontal: values.spacing.sm,
      }}>
      <Text numberOfLines={2} style={merchantItemCardFooterStyles.caption}>
        {shortName}
      </Text>
      {__distanceToDefaultPoint && (
        <Text
          style={[
            merchantItemCardFooterStyles.caption,
            { fontWeight: 'normal' },
          ]}>
          {(__distanceToDefaultPoint / 1).toFixed(1)}km away
        </Text>
      )}
    </View>
  );
}

const merchantItemCardFooterStyles = StyleSheet.create({
  caption: {
    color: colors.gray700,
    fontWeight: '600',
    fontSize: typography.size.sm,
  },
});
