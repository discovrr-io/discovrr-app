import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { colors, typography, values } from '../../constants';

import { selectProductById } from './productsSlice';

/**
 * @typedef {import('../../models').ProductId} ProductId
 * @typedef {{ productId: ProductId }} ProductItemCardProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {ProductItemCardProps & ViewProps} param0
 */
export default function ProductItemCard({ productId, ...props }) {
  const product = useSelector((state) => selectProductById(state, productId));

  return (
    <View style={[props.style]}>
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
    </View>
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
