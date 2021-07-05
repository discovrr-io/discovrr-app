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
 * @param {MerchantItemCardProps & ViewProps} param0
 */
export default function MerchantItemCard({ merchant, ...props }) {
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

  const [isImageLoaded, setIsLoadedImage] = useState(false);

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
            resizeMode="contain"
            onLoadEnd={() => setIsLoadedImage(true)}
            style={[
              {
                width: undefined,
                height: undefined,
                aspectRatio: coverPhotoWidth / coverPhotoHeight,
                opacity: isImageLoaded ? 1 : 0,
              },
              merchantItemCardStyles.imageContainer,
            ]}
          />
        </View>
      </TouchableOpacity>
      <Text
        numberOfLines={2}
        style={{
          color: colors.gray700,
          fontWeight: '600',
          fontSize: typography.size.sm,
          margin: values.spacing.sm,
          marginBottom: 0,
        }}>
        {shortName}
      </Text>
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
