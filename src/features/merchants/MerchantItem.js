import React from 'react';
import { Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { colors, typography, values } from '../../constants';

/**
 * @typedef {import('react-native').ViewProps} ViewProps
 * @typedef {import('../../models/common').ImageSource} ImageSource
 * @typedef {{ width: number, height: number }} ImageSourceDimensions
 *
 * @typedef {import('../../models/merchant').MerchantId} MerchantId
 * @typedef {{ merchantId: MerchantId, shortName: string, coverPhoto: ImageSource, coverPhotoDimensions: ImageSourceDimensions }} MerchantItemProps
 * @param {MerchantItemProps & ViewProps} param0
 * @returns
 */
export default function MerchantItem({
  merchantId,
  shortName,
  coverPhoto,
  coverPhotoDimensions,
  ...props
}) {
  return (
    <View style={[props.style]}>
      <FastImage
        source={coverPhoto}
        resizeMode="cover"
        style={{
          width: coverPhotoDimensions.width,
          height: coverPhotoDimensions.height,
          borderWidth: 1,
          borderRadius: values.radius.md,
          borderColor: colors.gray300,
          backgroundColor: colors.gray100,
        }}
      />
      <Text
        numberOfLines={2}
        style={{
          maxWidth: coverPhotoDimensions.width,
          fontWeight: '600',
          fontSize: typography.size.xs,
          margin: values.spacing.sm,
          color: colors.gray700,
        }}>
        {shortName}
      </Text>
    </View>
  );
}
