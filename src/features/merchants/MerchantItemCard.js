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
 * @typedef {{ merchant: Merchant }} MerchantItemCardProps
 * @typedef {import('react-native').ViewProps} ViewProps
 *
 * @param {MerchantItemCardProps & ViewProps} param0
 */
export default function MerchantItemCard({ merchant, ...props }) {
  const navigation = useNavigation();

  /** @type {import('../../models/common').ImageSource} */
  const coverPhoto = merchant.coverPhoto ?? DEFAULT_IMAGE;

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
            <ActivityIndicator size="large" />
          </View>
          <Image
            source={coverPhoto}
            resizeMode="cover"
            onLoad={(event) => {
              const { height, width } = event.nativeEvent.source;
              setImageDimensions({ height, width });
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
