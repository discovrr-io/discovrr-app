import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';

import { color, font, layout } from 'src/constants';
import { DEFAULT_TILE_SPACING } from 'src/constants/values';
import { fetchAllMerchants } from 'src/features/merchants/merchantsSlice';
import { fetchAllProducts } from 'src/features/products/productsSlice';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { MerchantId, NearMeItem, ProductId } from 'src/models';
import { FeedTopTabScreenProps } from 'src/navigation';
import { alertSomethingWentWrong } from 'src/utilities';

import {
  Button,
  EmptyContainer,
  LoadingContainer,
  LocationQueryBottomSheet,
  MasonryList,
  Spacer,
} from 'src/components';

import FeedFooter from './FeedFooter';
import MerchantItemCard from 'src/features/merchants/MerchantItemCard';
import ProductItemCard from 'src/features/products/ProductItemCard';

const MERCHANT_PAGINATION_LIMIT = 5;
const PRODUCT_PAGINATION_LIMIT = 8;
const TILE_SPACING = DEFAULT_TILE_SPACING;

function shuffleMerchantsAndProducts(
  merchantIds: MerchantId[],
  productIds: ProductId[],
): NearMeItem[] {
  // The current merchant index
  let curr = 0;

  // Here we shuffle by the product IDs, which are random enough anyway. Sorting
  // like this should provide a good enough randomised result.
  const shuffledProductIds = productIds
    .slice() // We don't want to mutate the original array
    .sort((a, b) => String(a).localeCompare(String(b)));

  const nearMeItems = shuffledProductIds.flatMap((productId, index) => {
    if (index % 2 === 0) {
      const merchantId = merchantIds[curr];
      if (curr < merchantIds.length) curr += 1;

      return [
        { type: 'product', item: productId } as NearMeItem,
        { type: 'merchant', item: merchantId } as NearMeItem,
      ];
    } else {
      return { type: 'product', item: productId } as NearMeItem;
    }
  });

  return nearMeItems;
}

type CurrentPage = {
  index: number;
  didReachEnd: boolean;
};

type NearMeFeedProps = FeedTopTabScreenProps<'NearMeFeed'>;

export default function NearMeFeed(_: NearMeFeedProps) {
  const $FUNC = '[NearMeFeed]';
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const [nearMeItems, setNearMeItems] = useState<NearMeItem[]>([]);
  const [currentMerchantsPage, setCurrentMerchantsPage] = useState(() => {
    return { index: 0, didReachEnd: false } as CurrentPage;
  });
  const [currentProductsPage, setCurrentProductsPage] = useState(() => {
    return { index: 0, didReachEnd: false } as CurrentPage;
  });

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [shouldFetchMore, setShouldFetchMore] = useState(false);

  useEffect(
    () => {
      async function fetchMerchantsAndProducts() {
        try {
          console.log($FUNC, 'Fetching merchants and products...');
          setCurrentMerchantsPage({ index: 0, didReachEnd: false });
          setCurrentProductsPage({ index: 0, didReachEnd: false });

          const fetchMerchantsAction = fetchAllMerchants({
            pagination: {
              limit: MERCHANT_PAGINATION_LIMIT,
              currentPage: currentMerchantsPage.index,
            },
          });

          const fetchProductsAction = fetchAllProducts({
            pagination: {
              limit: PRODUCT_PAGINATION_LIMIT,
              currentPage: currentProductsPage.index,
            },
          });

          const [merchants, products] = await Promise.all([
            dispatch(fetchMerchantsAction).unwrap(),
            dispatch(fetchProductsAction).unwrap(),
          ] as const);

          // Sometimes an `undefined` creeps up here
          const newNearMeItems = shuffleMerchantsAndProducts(
            merchants.map(it => it.id).filter(Boolean),
            products.map(it => it.id).filter(Boolean),
          );

          setNearMeItems(newNearMeItems);
          setCurrentMerchantsPage({
            index: 1,
            didReachEnd: merchants.length === 0,
          });
          setCurrentProductsPage({
            index: 1,
            didReachEnd: products.length === 0,
          });

          console.log($FUNC, 'Finished fetching near me items');
        } catch (error) {
          console.error($FUNC, 'Failed to fetch near me items:', error);
          alertSomethingWentWrong();
        } finally {
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      }

      if (isInitialRender || shouldRefresh) fetchMerchantsAndProducts();
    },
    // We only want to run this effect if `inInitialRender` or `shouldRefresh`
    // changes. The other dependencies rely on the result of this effect anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, isInitialRender, shouldRefresh],
  );

  useEffect(
    () => {
      async function fetchMoreMerchantsAndProducts() {
        console.log(
          $FUNC,
          `Fetching more merchants (page ${currentMerchantsPage.index}) and`,
          `products (page ${currentProductsPage.index})...`,
        );

        // We don't want to update these just yet...
        const nextMerchantsPage = currentMerchantsPage.index + 1;
        const nextProductsPage = currentProductsPage.index + 1;

        try {
          const fetchMerchantsAction = fetchAllMerchants({
            pagination: {
              limit: MERCHANT_PAGINATION_LIMIT,
              currentPage: nextMerchantsPage,
            },
          });

          const fetchProductsAction = fetchAllProducts({
            pagination: {
              limit: PRODUCT_PAGINATION_LIMIT,
              currentPage: nextProductsPage,
            },
          });

          const [merchants, products] = await Promise.all([
            currentMerchantsPage.didReachEnd
              ? Promise.resolve([])
              : dispatch(fetchMerchantsAction).unwrap(),
            currentProductsPage.didReachEnd
              ? Promise.resolve([])
              : dispatch(fetchProductsAction).unwrap(),
          ]);

          // Sometimes an `undefined` creeps up here
          const newNearMeItems = shuffleMerchantsAndProducts(
            merchants.map(it => it.id).filter(Boolean),
            products.map(it => it.id).filter(Boolean),
          );

          setNearMeItems(prev => prev.concat(newNearMeItems));
          setCurrentMerchantsPage({
            index: 1,
            didReachEnd: merchants.length === 0,
          });
          setCurrentProductsPage({
            index: 1,
            didReachEnd: products.length === 0,
          });

          console.log($FUNC, 'Finished fetching more near me items');
        } catch (error) {
          console.error(
            $FUNC,
            'Failed to fetch more merchants and products:',
            error,
          );
          alertSomethingWentWrong();
        } finally {
          if (isMounted.current && shouldFetchMore) setShouldFetchMore(false);
        }
      }

      if (shouldFetchMore) fetchMoreMerchantsAndProducts();
    },
    // We only want to run this effect if `shouldFetchMore` changes. The other
    // dependencies rely on the result of this effect anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, shouldFetchMore],
  );

  const handleRefresh = () => {
    if (!shouldRefresh && !shouldFetchMore) setShouldRefresh(true);
  };

  const handleFetchMore = () => {
    if (!shouldFetchMore && !shouldFetchMore) setShouldFetchMore(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <SearchLocationOptions />
      <MasonryList
        data={nearMeItems}
        // onEndReached={handleFetchMore}
        onEndReachedThreshold={0}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          !isInitialRender ? (
            <RefreshControl
              title="Loading activity near you..."
              tintColor={color.gray500}
              titleColor={color.gray700}
              refreshing={!isInitialRender && !shouldFetchMore && shouldRefresh}
              onRefresh={handleRefresh}
            />
          ) : undefined
        }
        ListEmptyComponent={
          isInitialRender ? (
            <LoadingContainer message="Loading activity near you..." />
          ) : (
            <EmptyContainer
              emoji="😕"
              message="We couldn't find anything near you. Try refining your search to somewhere more specific"
            />
          )
        }
        renderItem={({ item: nearMeItem, column }) => {
          if (nearMeItem.type === 'merchant') {
            return (
              <MerchantItemCard
                key={nearMeItem.item}
                merchantId={nearMeItem.item}
                elementOptions={{ smallContent: true }}
                style={{
                  marginTop: TILE_SPACING,
                  marginLeft:
                    column % 2 === 0 ? TILE_SPACING : TILE_SPACING / 2,
                  marginRight:
                    column % 2 !== 0 ? TILE_SPACING : TILE_SPACING / 2,
                }}
              />
            );
          } else {
            return (
              <ProductItemCard
                key={nearMeItem.item}
                productId={nearMeItem.item}
                elementOptions={{ smallContent: true }}
                style={{
                  marginTop: TILE_SPACING,
                  marginLeft:
                    column % 2 === 0 ? TILE_SPACING : TILE_SPACING / 2,
                  marginRight:
                    column % 2 !== 0 ? TILE_SPACING : TILE_SPACING / 2,
                }}
              />
            );
          }
        }}
        ListFooterComponent={
          nearMeItems.length > 0 ? (
            <FeedFooter
              didReachEnd={
                currentMerchantsPage.didReachEnd &&
                currentProductsPage.didReachEnd
              }
            />
          ) : null
        }
      />
    </View>
  );
}

function SearchLocationOptions() {
  const queryPrefs = useAppSelector(state => state.settings.locationQueryPrefs);

  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: layout.spacing.sm,
        paddingHorizontal: layout.defaultScreenMargins.horizontal,
        backgroundColor: color.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: color.gray200,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="location" size={18} color={color.black} />
        <Spacer.Horizontal value={layout.spacing.xs} />
        <Text style={[font.smallBold]}>
          Searching in {JSON.stringify(queryPrefs?.coordinates ?? 'NULL')}
        </Text>
      </View>
      <Button
        title="Change Location"
        type="primary"
        size="small"
        onPress={() => bottomSheetRef.current?.expand()}
        containerStyle={{ paddingHorizontal: 0 }}
      />
      <LocationQueryBottomSheet ref={bottomSheetRef} />
    </View>
  );
}
