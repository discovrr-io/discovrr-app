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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import {
  colors,
  typography,
  values,
  DEFAULT_ACTIVE_OPACITY,
} from '../../constants';
import { selectProductById } from './productsSlice';

/**
 * @typedef {import('../../models').ProductId} ProductId
 * @typedef {{ productId: ProductId }} ProductItemCardProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {ProductItemCardProps & ViewProps} param0
 */
export default function ProductItemCard({ productId, ...props }) {
  const navigation = useNavigation();
  const product = useSelector((state) => selectProductById(state, productId));

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  if (!product) {
    console.warn(
      '[ProductItemCard] Failed to select product with id:',
      productId,
    );
    return null;
  }

  const handlePressProduct = () => {
    navigation.push('ProductCheckoutScreen', {
      productName: product.name,
      squareSpaceUrl: product.squareSpaceUrl,
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      onPress={handlePressProduct}
      style={props.style}>
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
        <Icon name="shopping-outline" color={colors.white} size={20} />
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
            productItemCardStyles.imageContainer,
          ]}>
          <ActivityIndicator size="large" />
        </View>
        <Image
          source={{ uri: product.imageUrl }}
          onLoadEnd={() => setIsImageLoaded(true)}
          style={[
            {
              aspectRatio: 1,
              opacity: isImageLoaded ? 1 : 0,
            },
            productItemCardStyles.imageContainer,
          ]}
        />
      </View>
      <View style={{ margin: values.spacing.sm }}>
        <Text numberOfLines={2} style={productItemCardStyles.productName}>
          {product.name}
        </Text>
        <Text style={productItemCardStyles.productPrice}>${product.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const productItemCardStyles = StyleSheet.create({
  imageContainer: {
    borderWidth: values.border.thin,
    borderRadius: values.radius.md,
    borderColor: colors.gray300,
    backgroundColor: colors.gray100,
  },
  productName: {
    fontSize: typography.size.md,
  },
  productPrice: {
    fontWeight: '700',
    fontSize: typography.size.h4,
  },
});
