import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
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
      <FastImage
        source={{ uri: product.imageUrl }}
        style={{
          aspectRatio: 1,
          borderRadius: values.radius.md,
          borderWidth: values.border.thin,
          borderColor: colors.gray300,
          backgroundColor: colors.gray100,
        }}
      />
      <View style={{}}>
        <Text style={productItemCardStyles.productName}>{product.name}</Text>
        <Text style={productItemCardStyles.productPrice}>${product.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const productItemCardStyles = StyleSheet.create({
  productName: {
    fontSize: typography.size.md,
  },
  productPrice: {
    fontWeight: '700',
    fontSize: typography.size.h4,
  },
});
