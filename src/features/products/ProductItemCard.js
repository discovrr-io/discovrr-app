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
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { FEATURE_UNAVAILABLE } from '../../constants/strings';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { selectMerchantById } from '../merchants/merchantsSlice';
import { changeProductLikeStatus, selectProductById } from './productsSlice';

import {
  colors,
  typography,
  values,
  DEFAULT_ACTIVE_OPACITY,
} from '../../constants';

const SMALL_ICON = 24;

const alertUnimplementedFeature = () => {
  Alert.alert(FEATURE_UNAVAILABLE.title, FEATURE_UNAVAILABLE.message);
};

/**
 * @typedef {import('../../models').ProductId} ProductId
 * @typedef {{ productId: ProductId, promoLabel?: string, showFooter?: boolean, displayedOnNearMeTab?: boolean }} ProductItemCardProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {ProductItemCardProps & ViewProps} param0
 */
export default function ProductItemCard({
  productId,
  promoLabel = undefined,
  showFooter = false,
  displayedOnNearMeTab = false, // For analytics purposes
  ...props
}) {
  const navigation = useNavigation();
  const product = useAppSelector((state) =>
    selectProductById(state, productId),
  );

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
      productId: product.id,
      productName: product.name,
      squareSpaceUrl: product.squareSpaceUrl,
    });
  };

  return (
    <View style={props.style}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressProduct}>
        {promoLabel && (
          <View
            style={{
              position: 'absolute',
              zIndex: 1,
              top: values.spacing.sm * 1.25,
              left: values.spacing.sm * 1.25,
              backgroundColor: colors.accent,
              paddingVertical: values.spacing.sm,
              paddingHorizontal: values.spacing.md,
              borderRadius: 20,
            }}>
            <Text style={{ color: colors.white, fontWeight: '700' }}>
              {promoLabel}
            </Text>
          </View>
        )}
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
          <MaterialCommunityIcon
            name="shopping-outline"
            color={colors.white}
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
              productItemCardStyles.imageContainer,
            ]}>
            <ActivityIndicator size="large" color={colors.gray500} />
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: values.spacing.sm,
            marginTop: values.spacing.xs * 1.5,
          }}>
          <Text numberOfLines={2} style={productItemCardStyles.productName}>
            {product.name}
          </Text>
          <Text style={productItemCardStyles.productPrice}>
            {/* {product.price === 0 ? 'Free' : `$${product.price}`} */}$
            {product.price}
          </Text>
        </View>
      </TouchableOpacity>
      {showFooter && (
        <ProductItemCardFooter
          productId={product.id}
          merchantId={product.merchantId}
          displayedOnNearMeTab={displayedOnNearMeTab}
        />
      )}
    </View>
  );
}

const productItemCardStyles = StyleSheet.create({
  imageContainer: {
    // borderWidth: values.border.thin,
    // borderColor: colors.gray300,
    borderRadius: values.radius.md,
    backgroundColor: colors.gray100,
  },
  productName: {
    fontSize: typography.size.xs + 1,
    flexGrow: 1,
    flexShrink: 1,
  },
  productPrice: {
    fontWeight: '700',
    fontSize: typography.size.lg,
    marginLeft: values.spacing.sm,
  },
});

/**
 * @typedef {import('../../models').MerchantId} MerchantId
 * @param {{ productId: ProductId, merchantId: MerchantId, displayedOnNearMeTab?: boolean }} param0
 */
export function ProductItemCardFooter({
  productId,
  merchantId,
  displayedOnNearMeTab = false, // For analytics purposes
}) {
  const $FUNC = '[ProductItemCardFooter]';
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const product = useAppSelector((state) =>
    selectProductById(state, productId),
  );
  const merchant = useAppSelector((state) =>
    selectMerchantById(state, merchantId),
  );

  const { statistics } = product ?? {};
  const { avatar, shortName } = merchant ?? {};
  const { didSave = false, didLike = false, totalLikes = 0 } = statistics ?? {};

  const [isProcessingLike, setIsProcessingLike] = useState(false);

  if (!product || !merchant) {
    console.warn($FUNC, 'One of the following is not defined:', {
      product,
      merchant,
    });

    return null;
  }

  const handlePressLike = async () => {
    try {
      setIsProcessingLike(true);

      const newDidLike = !didLike;
      console.log($FUNC, `Will ${newDidLike ? 'like' : 'unlike'} merchant...`);

      await dispatch(
        changeProductLikeStatus({
          productId: productId,
          didLike: newDidLike,
        }),
      ).unwrap();

      if (newDidLike && product && merchant) {
        try {
          await analytics().logEvent('like_product', {
            product_id: product.id,
            product_name: product.name,
            merchant_name: merchant.shortName,
            from_near_me_tab: displayedOnNearMeTab,
          });
        } catch (error) {
          console.error($FUNC, 'Failed to send `like_product` event:', error);
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
    <View style={productItemCardFooterStyles.container}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={() =>
          navigation.navigate('MerchantProfileScreen', {
            merchantId,
            merchantShortName: shortName,
          })
        }
        style={{ flex: 1 }}>
        <View style={productItemCardFooterStyles.productContainer}>
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
            style={productItemCardFooterStyles.productName}>
            {shortName}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={productItemCardFooterStyles.actionsContainer}>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={alertUnimplementedFeature}>
          <MaterialIcon
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
            <MaterialIcon
              name={didLike ? 'favorite' : 'favorite-border'}
              color={didLike ? colors.red500 : colors.gray}
              size={SMALL_ICON}
            />
          </Animatable.View>
        </TouchableOpacity>
        <Text
          style={[
            productItemCardFooterStyles.likesCount,
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

const productItemCardFooterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: values.spacing.xs,
    marginHorizontal: values.spacing.sm,
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
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
