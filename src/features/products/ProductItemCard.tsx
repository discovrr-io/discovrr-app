import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import * as constants from 'src/components/cards/constants';
import { AsyncGate, Card, Spacer } from 'src/components';
import { CardElementProps } from 'src/components/cards/common';
import { color, font, layout } from 'src/constants';
import { useMerchant } from 'src/features/merchants/hooks';
import { Merchant, MerchantId, Product, ProductId } from 'src/models';
import { alertUnavailableFeature } from 'src/utilities';

import { useProduct } from './hooks';
import { DEFAULT_AVATAR } from 'src/constants/media';

type ProductItemCardWrapperProps = CardElementProps & {
  productId: ProductId;
};

export default function ProductItemCardWrapper(
  props: ProductItemCardWrapperProps,
) {
  const { productId, ...cardElementProps } = props;
  const productData = useProduct(productId);

  return (
    <AsyncGate
      data={productData}
      onPending={() => <ProductItemCard.Pending {...cardElementProps} />}
      onFulfilled={product => {
        if (!product) return null;
        return <ProductItemCard product={product} {...cardElementProps} />;
      }}
    />
  );
}

type ProductItemCardProps = CardElementProps & {
  product: Product;
};

const ProductItemCard = (props: ProductItemCardProps) => {
  const { product, ...cardElementProps } = props;
  const { didLike, totalLikes } = product.statistics;

  return (
    <Card {...cardElementProps}>
      <Card.Body onPress={() => alertUnavailableFeature()}>
        {elementOptions => (
          <View>
            <View>
              <Card.Indicator iconName="pricetags" position="top-right" />
              <FastImage
                resizeMode="cover"
                source={{ uri: product.imageUrl }}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  backgroundColor: color.placeholder,
                }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: elementOptions.insetHorizontal,
                paddingVertical: elementOptions.insetVertical,
              }}>
              <Text
                numberOfLines={3}
                style={[
                  elementOptions.captionTextStyle,
                  { flexGrow: 1, flexShrink: 1 },
                ]}>
                {product.name}
              </Text>
              <Spacer.Horizontal
                value={layout.spacing.md}
                style={{ height: 2 }}
              />
              <Text
                style={
                  elementOptions.smallContent
                    ? font.largeBold
                    : [{ ...font.extraLargeBold, fontSize: font.size.h3 }]
                }>
                ${product.price}
              </Text>
            </View>
          </View>
        )}
      </Card.Body>
      <Card.Footer>
        <ProductItemCardAuthor merchantId={product.merchantId} />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={didLike}
            totalLikes={totalLikes}
            onToggleLike={() => alertUnavailableFeature()}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
};

ProductItemCard.Pending = (props: CardElementProps) => {
  return (
    <Card {...props}>
      <Card.Body>
        {elementOptions => (
          <View>
            <View style={[productItemCardStyles.cardBodyPlaceholder]}>
              <ActivityIndicator
                color={color.gray300}
                style={{
                  transform: [{ scale: elementOptions.smallContent ? 2 : 3 }],
                }}
              />
            </View>
            <View
              style={[
                productItemCardStyles.cardCaptionContainerPlaceholder,
                {
                  paddingHorizontal: elementOptions.insetHorizontal,
                  paddingVertical: elementOptions.insetVertical,
                },
              ]}>
              <View
                style={[
                  productItemCardStyles.cardCaptionText,
                  {
                    height: elementOptions.smallContent
                      ? constants.CARD_PLACEHOLDER_TEXT_HEIGHT_SMALL * 1.1
                      : constants.CARD_PLACEHOLDER_TEXT_HEIGHT_LARGE * 1.4,
                  },
                ]}
              />
              <Spacer.Horizontal value={elementOptions.insetHorizontal} />
              <View
                style={[
                  productItemCardStyles.cardCaptionPrice,
                  {
                    height: elementOptions.smallContent
                      ? constants.CARD_PLACEHOLDER_TEXT_HEIGHT_SMALL * 1.25
                      : constants.CARD_PLACEHOLDER_TEXT_HEIGHT_LARGE * 1.4,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </Card.Body>
      <Card.Footer>
        <Card.Author.Pending />
        <Card.Actions.Pending />
      </Card.Footer>
    </Card>
  );
};

type ProductItemCardAuthorProps = CardElementProps & {
  merchantId: MerchantId;
};

const ProductItemCardAuthor = (props: ProductItemCardAuthorProps) => {
  const { merchantId, ...cardElementProps } = props;
  const merchantData = useMerchant(merchantId);

  const handlePressAuthor = (merchant: Merchant | undefined) => {
    if (!merchant) {
      console.warn(`Cannot navigate to merchant with ID '${merchantId}'`);
      return;
    }

    alertUnavailableFeature();
  };

  return (
    <AsyncGate
      data={merchantData}
      onPending={() => <Card.Author.Pending {...cardElementProps} />}
      onRejected={() => (
        <Card.Author displayName="Anonymous" {...cardElementProps} />
      )}
      onFulfilled={merchant => (
        <Card.Author
          avatar={merchant?.avatar ?? DEFAULT_AVATAR}
          displayName={merchant?.shortName ?? 'Anonymous'}
          onPress={() => handlePressAuthor(merchant)}
          {...cardElementProps}
        />
      )}
    />
  );
};

const productItemCardStyles = StyleSheet.create({
  cardBodyPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: color.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCaptionContainerPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCaptionText: {
    width: '55%',
    backgroundColor: color.placeholder,
  },
  cardCaptionPrice: {
    width: '20%',
    backgroundColor: color.placeholder,
  },
});
