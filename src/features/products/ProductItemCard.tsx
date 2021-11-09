import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/core';

import { ApiFetchStatus, ProductApi } from 'src/api';
import { color, font, layout } from 'src/constants';
import { fetchProfileByVendorProfileId } from 'src/features/profiles/profiles-slice';
import { useAppDispatch, useIsMounted } from 'src/hooks';
import { Product, ProductId, Profile, VendorProfileId } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';

import { AsyncGate, Card, Spacer } from 'src/components';
import { CardAuthorProps } from 'src/components/cards/CardAuthor';
import {
  CardElementOptions,
  CardElementProps,
} from 'src/components/cards/common';
import {
  CARD_PLACEHOLDER_TEXT_HEIGHT_SMALL,
  CARD_PLACEHOLDER_TEXT_HEIGHT_LARGE,
} from 'src/components/cards/constants';

import { useProduct } from './hooks';

type ProductItemCardProps = CardElementProps & {
  productId: ProductId;
};

export default function ProductItemCard(props: ProductItemCardProps) {
  const { productId, ...cardElementProps } = props;
  const productData = useProduct(productId);

  return (
    <AsyncGate
      data={productData}
      onPending={() => <InnerProductItemCard.Pending {...cardElementProps} />}
      onFulfilled={product => {
        if (!product) return null;
        return <InnerProductItemCard product={product} {...cardElementProps} />;
      }}
    />
  );
}

type InnerProductItemCardProps = CardElementProps & {
  product: Product;
};

const InnerProductItemCard = (props: InnerProductItemCardProps) => {
  const { product, ...cardElementProps } = props;
  const { didLike, totalLikes } = product.statistics;
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressProduct = () => {
    navigation.push('ProductDetails', {
      productId: product.id,
      productName: product.name,
    });
  };

  return (
    <Card {...cardElementProps}>
      <Card.Body onPress={handlePressProduct}>
        {elementOptions => (
          <ProductItemCardBody {...elementOptions} body={product} />
        )}
      </Card.Body>
      <Card.Footer>
        <ProductItemCardAuthor vendorProfileId={product.vendorId} />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={didLike}
            totalLikes={totalLikes}
            onToggleLike={() => {}}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
};

InnerProductItemCard.Pending = (props: CardElementProps) => {
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
                      ? CARD_PLACEHOLDER_TEXT_HEIGHT_SMALL * 1.1
                      : CARD_PLACEHOLDER_TEXT_HEIGHT_LARGE * 1.4,
                  },
                ]}
              />
              <Spacer.Horizontal value={elementOptions.insetHorizontal} />
              <View
                style={[
                  productItemCardStyles.cardCaptionPrice,
                  {
                    height: elementOptions.smallContent
                      ? CARD_PLACEHOLDER_TEXT_HEIGHT_SMALL * 1.25
                      : CARD_PLACEHOLDER_TEXT_HEIGHT_LARGE * 1.4,
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

//#region ProductItemCardBody

type ProductItemCardBodyProps = CardElementOptions & {
  body: Pick<
    Product,
    'name' | 'description' | 'price' | 'media' | 'statistics'
  >;
};

function ProductItemCardBody(props: ProductItemCardBodyProps) {
  const { body, ...cardElementOptions } = props;

  return (
    <View>
      <View>
        <Card.Indicator iconName="pricetags" position="top-right" />
        <FastImage
          resizeMode="cover"
          source={{ uri: body.media[0]?.url }}
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
          paddingHorizontal: cardElementOptions.insetHorizontal,
          paddingVertical: cardElementOptions.insetVertical,
        }}>
        <Text
          numberOfLines={3}
          style={[
            cardElementOptions.captionTextStyle,
            { flexGrow: 1, flexShrink: 1 },
          ]}>
          {body.name}
        </Text>
        <Spacer.Horizontal value={layout.spacing.md} style={{ height: 2 }} />
        <Text
          style={
            cardElementOptions.smallContent
              ? font.largeBold
              : [{ ...font.extraLargeBold, fontSize: font.size.h3 }]
          }>
          ${body.price}
        </Text>
      </View>
    </View>
  );
}

//#region ProductItemCardPreview -----------------------------------------------

type ProductItemCardAuthorProps = CardElementProps & {
  vendorProfileId: VendorProfileId;
};

const ProductItemCardAuthor = (props: ProductItemCardAuthorProps) => {
  const $FUNC = '[ProductItemCardAuthor]';
  const { vendorProfileId, ...cardElementProps } = props;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();
  const isMounted = useIsMounted();

  const [foundProfile, setFoundProfile] = useState<Profile>();
  const [status, setStatus] = useState<ApiFetchStatus>({ status: 'idle' });

  const getProfileDisplayName = useCallback((profile: Profile | undefined) => {
    if (!profile) {
      return 'Anonymous';
    } else if (profile.kind === 'vendor') {
      return profile.businessName || profile.displayName;
    } else {
      console.warn(
        $FUNC,
        'ProductItemCard found a profile that is NOT a vendor,',
        'which is unexpected.',
      );
      return profile.displayName;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setStatus({ status: 'pending' });
        const fetchAction = fetchProfileByVendorProfileId({ vendorProfileId });
        const profile = await dispatch(fetchAction).unwrap();
        if (isMounted.current) {
          setStatus({ status: 'fulfilled' });
          setFoundProfile(profile);
        }
      } catch (error: any) {
        if (error.name !== 'ConditionError') {
          console.error(
            $FUNC,
            'Failed to fetch profile by vendor profile with',
            `ID '${vendorProfileId}':`,
            error,
          );
          if (isMounted.current) {
            setStatus({ status: 'rejected', error });
          }
        }
      }
    })();
  }, [dispatch, isMounted, vendorProfileId]);

  const handlePressAuthor = (profile: Profile | undefined) => {
    if (!profile) {
      console.warn(
        `Cannot navigate to vendor profile with ID '${vendorProfileId}'`,
      );
      return;
    }

    navigation.navigate('ProfileDetails', {
      profileId: profile.profileId,
      profileDisplayName: getProfileDisplayName(profile),
    });
  };

  return (
    <AsyncGate
      data={[foundProfile, status]}
      onPending={() => <Card.Author.Pending {...cardElementProps} />}
      onRejected={() => (
        <Card.Author displayName="Anonymous" {...cardElementProps} />
      )}
      onFulfilled={profile => (
        <Card.Author
          avatar={profile?.avatar}
          displayName={getProfileDisplayName(profile)}
          onPress={() => handlePressAuthor(profile)}
          {...cardElementProps}
        />
      )}
    />
  );
};

//#region ProductItemCardPreview -----------------------------------------------

type ProductContents = Omit<
  ProductApi.CreateProductParams,
  'tags' | 'categories' | 'hidden'
>;

type ProductItemCardPreviewProps = CardElementProps & {
  contents: ProductContents;
  author: CardAuthorProps;
  statistics?: Partial<Product['statistics']>;
};

export function ProductItemCardPreview(props: ProductItemCardPreviewProps) {
  const { contents, author, statistics, elementOptions, style } = props;

  return (
    <Card elementOptions={{ ...elementOptions, disabled: true }} style={style}>
      <Card.Body>
        {elementOptions => (
          <ProductItemCardBody
            {...elementOptions}
            body={{
              ...contents,
              statistics: {
                didLike: false,
                didSave: false,
                totalLikes: 0,
                totalViews: 0,
                ...statistics,
              },
            }}
          />
        )}
      </Card.Body>
      <Card.Footer>
        <Card.Author {...author} />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={statistics?.didLike ?? false}
            totalLikes={statistics?.totalLikes ?? 0}
            onToggleLike={() => {}}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
}

//#endregion ProductItemCardPreview

//#region Styles ---------------------------------------------------------------

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
