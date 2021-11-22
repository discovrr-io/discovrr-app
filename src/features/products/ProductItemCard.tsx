import * as React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/core';

import * as constants from 'src/constants';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { ApiFetchStatus, MediaSource, ProductApi } from 'src/api';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
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
import { CardIndicatorRow } from 'src/components/cards/CardIndicator';

type ProductItemCardProps = CardElementProps & {
  productId: ProductId;
};

export default function ProductItemCard(props: ProductItemCardProps) {
  const { productId, ...cardElementProps } = props;
  const productData = useProduct(productId);

  return (
    <AsyncGate
      data={productData}
      onPending={() => <LoadedProductItemCard.Pending {...cardElementProps} />}
      onFulfilled={product => {
        if (!product) return null;
        return (
          <LoadedProductItemCard product={product} {...cardElementProps} />
        );
      }}
    />
  );
}

type InnerProductItemCardProps = CardElementProps & {
  product: Product;
};

const LoadedProductItemCard = (props: InnerProductItemCardProps) => {
  const { product, ...cardElementProps } = props;
  const { didLike, totalLikes } = product.statistics;
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressProduct = () => {
    if (product.hidden) {
      Alert.alert(
        'This product is hidden',
        "You'll be able to manage this product soon.",
      );
      return;
    }

    navigation.push('ProductDetails', {
      productId: product.id,
      productName: product.name,
    });
  };

  return (
    <Card
      elementOptions={cardElementProps.elementOptions}
      style={[cardElementProps.style, product.hidden && { opacity: 0.4 }]}>
      <Card.Body onPress={handlePressProduct}>
        {elementOptions => (
          <ProductItemCardBody {...elementOptions} product={product} />
        )}
      </Card.Body>
      <Card.Footer>
        <ProductItemCardAuthor vendorProfileId={product.vendorId} />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={didLike}
            totalLikes={totalLikes}
            onToggleLike={() => {}}
            elementOptions={{
              ...cardElementProps.elementOptions,
              disabled: product.hidden,
            }}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
};

LoadedProductItemCard.Pending = (props: CardElementProps) => {
  return (
    <Card {...props}>
      <Card.Body>
        {elementOptions => (
          <View>
            <View style={[productItemCardStyles.cardBodyPlaceholder]}>
              <ActivityIndicator
                color={constants.color.gray300}
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
  product: Pick<
    Product,
    'name' | 'description' | 'price' | 'media' | 'hidden' | 'statistics'
  >;
};

function ProductItemCardBody(props: ProductItemCardBodyProps) {
  const { product, ...cardElementOptions } = props;
  const [dollars, cents] = product.price.toFixed(2).split('.');
  const thumbnail: MediaSource | undefined = product.media[0];

  return (
    <View>
      <View>
        <CardIndicatorRow
          position="top-right"
          iconNames={['pricetags'].concat(product.hidden ? 'eye-off' : [])}
        />
        <FastImage
          resizeMode="cover"
          source={
            thumbnail ? { uri: thumbnail.url } : constants.media.DEFAULT_IMAGE
          }
          style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: constants.color.placeholder,
          }}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: cardElementOptions.insetHorizontal,
          paddingVertical: cardElementOptions.insetVertical,
        }}>
        <Text
          numberOfLines={3}
          style={[
            cardElementOptions.captionTextStyle,
            { flexGrow: 1, flexShrink: 1 },
          ]}>
          {product.name}
        </Text>
        <Spacer.Horizontal value="md" style={{ height: 2 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text
            style={[
              cardElementOptions.smallContent
                ? constants.font.largeBold
                : {
                    ...constants.font.extraLargeBold,
                    fontSize: constants.font.size.h3,
                  },
              { textAlign: 'right' },
            ]}>
            ${dollars}
            {cents !== '00' && <Text>{`.${cents}`}</Text>}
          </Text>
        </View>
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

  const [foundProfile, setFoundProfile] = React.useState<Profile>();
  const [status, setStatus] = React.useState<ApiFetchStatus>({
    status: 'idle',
  });

  const isMyProfile = useAppSelector(state => {
    if (!foundProfile) return false;
    if (!state.auth.user) return false;
    return state.auth.user.profileId === foundProfile.profileId;
  });

  const getProfileDisplayName = React.useCallback(
    (profile: Profile | undefined) => {
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
    },
    [],
  );

  React.useEffect(() => {
    (async () => {
      try {
        setStatus({ status: 'pending' });
        const fetchAction = profilesSlice.fetchProfileByVendorProfileId({
          vendorProfileId,
        });
        const profile = await dispatch(fetchAction).unwrap();
        setStatus({ status: 'fulfilled' });
        setFoundProfile(profile);
      } catch (error: any) {
        if (error.name !== 'ConditionError') {
          console.error(
            $FUNC,
            'Failed to fetch profile by vendor profile with',
            `ID '${vendorProfileId}':`,
            error,
          );
          setStatus({ status: 'rejected', error });
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
          isMyProfile={isMyProfile}
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
> & {
  media: MediaSource[];
};

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
            product={{
              ...contents,
              hidden: false,
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
    backgroundColor: constants.color.placeholder,
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
    backgroundColor: constants.color.placeholder,
  },
  cardCaptionPrice: {
    width: '20%',
    backgroundColor: constants.color.placeholder,
  },
});
