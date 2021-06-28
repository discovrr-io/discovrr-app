import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { DEFAULT_IMAGE, DEFAULT_IMAGE_DIMENSIONS } from '../../constants/media';
import { FEATURE_UNAVAILABLE } from '../../constants/strings';

import {
  colors,
  DEFAULT_ACTIVE_OPACITY,
  typography,
  values,
} from '../../constants';

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @typedef {{ merchant: Merchant }} MerchantItemProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {MerchantItemProps & ViewProps} param0
 */
export default function MerchantItem({ merchant, ...props }) {
  const navigation = useNavigation();

  const { shortName } = merchant;

  /** @type {import('../../models/common').ImageSource} */
  const coverPhoto = merchant.coverPhoto ?? DEFAULT_IMAGE;
  /** @type {number} */
  let coverPhotoWidth, coverPhotoHeight;

  if (typeof coverPhoto === 'number') {
    coverPhotoWidth = DEFAULT_IMAGE_DIMENSIONS.width;
    coverPhotoHeight = DEFAULT_IMAGE_DIMENSIONS.height;
  } else {
    coverPhotoWidth = coverPhoto.width;
    coverPhotoHeight = coverPhoto.height;
  }

  return (
    <View style={[props.style]}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={() =>
          navigation.navigate('MerchantProfileScreen', {
            merchant,
          })
        }>
        <View
          style={{
            position: 'absolute',
            zIndex: 1,
            top: values.spacing.sm,
            right: values.spacing.sm,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            padding: values.spacing.sm,
            borderRadius: 20,
          }}>
          <Icon name="storefront" color={colors.white} size={20} />
        </View>
        <FastImage
          source={coverPhoto}
          resizeMode="cover"
          style={{
            aspectRatio: coverPhotoWidth / coverPhotoHeight,
            borderWidth: 1,
            borderRadius: values.radius.md,
            borderColor: colors.gray300,
            backgroundColor: colors.gray100,
          }}
        />
      </TouchableOpacity>
      <Text
        numberOfLines={2}
        style={{
          color: colors.gray700,
          fontWeight: '600',
          fontSize: typography.size.sm,
          margin: values.spacing.sm,
          marginBottom: 0,
          maxWidth: coverPhotoWidth,
        }}>
        {shortName}
      </Text>
    </View>
  );
}
