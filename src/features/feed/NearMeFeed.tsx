import * as React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';

import { color, font, layout } from 'src/constants';
import { DEFAULT_TILE_SPACING } from 'src/constants/values';
import { fetchAllProducts } from 'src/features/products/products-slice';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { NearMeItem, ProductId, ProfileId } from 'src/models';
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
import ProductItemCard from 'src/features/products/ProductItemCard';
import VendorProfileItemCard from 'src/features/profiles/vendor/VendorProfileItemCard';
import { fetchAllProfilesByKind } from '../profiles/profiles-slice';

const VENDOR_PAGINATION_LIMIT = 7;
const PRODUCT_PAGINATION_LIMIT = 18;
const TILE_SPACING = DEFAULT_TILE_SPACING;

function shuffleVendorsAndProducts(
  profileIds: ProfileId[],
  productIds: ProductId[],
): NearMeItem[] {
  const nearMeItems: NearMeItem[] = [];

  const shuffledProductIds = productIds
    .slice()
    .sort((a, b) => String(a).localeCompare(String(b)));

  let currentVendorIndex = 0;
  for (let i = 0; i < shuffledProductIds.length; i++) {
    const productId = shuffledProductIds[i];

    if (currentVendorIndex % 2 === 0) {
      const merchantId = profileIds[currentVendorIndex];
      if (currentVendorIndex < profileIds.length) currentVendorIndex++;

      nearMeItems.push(
        { type: 'product', item: productId },
        { type: 'profile', item: merchantId },
      );
    } else {
      nearMeItems.push({ type: 'product', item: productId });
    }
  }

  // Get the remaining profile IDs of vendors and convert them to `NearMeItem`s
  const restProfileIds = profileIds
    .slice(currentVendorIndex)
    .map((item): NearMeItem => ({ type: 'profile', item }));

  return [...nearMeItems, ...restProfileIds];
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

  const [nearMeItems, setNearMeItems] = React.useState<NearMeItem[]>([]);
  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);
  const [shouldFetchMore, setShouldFetchMore] = React.useState(false);

  const [currentMerchantsPage, setCurrentVendorsPage] =
    React.useState<CurrentPage>({ index: 0, didReachEnd: false });
  const [currentProductsPage, setCurrentProductsPage] =
    React.useState<CurrentPage>({ index: 0, didReachEnd: false });

  const didReachEndFeed = React.useMemo(() => {
    return currentMerchantsPage.didReachEnd && currentProductsPage.didReachEnd;
  }, [currentMerchantsPage, currentProductsPage]);

  React.useEffect(
    () => {
      async function fetchVendorsAndProducts() {
        try {
          console.log($FUNC, 'Fetching merchants and products...');
          setCurrentVendorsPage({ index: 0, didReachEnd: false });
          setCurrentProductsPage({ index: 0, didReachEnd: false });

          const fetchVendorsAction = fetchAllProfilesByKind({
            kind: 'vendor',
            pagination: {
              currentPage: 0,
              limit: VENDOR_PAGINATION_LIMIT,
            },
          });

          const fetchProductsAction = fetchAllProducts({
            reload: shouldRefresh,
            pagination: {
              currentPage: 0,
              limit: PRODUCT_PAGINATION_LIMIT,
            },
          });

          const [vendors, products] = await Promise.all([
            dispatch(fetchVendorsAction).unwrap(),
            dispatch(fetchProductsAction).unwrap(),
          ] as const);

          // Sometimes an `undefined` creeps up here
          const refreshedNearMeItems = shuffleVendorsAndProducts(
            vendors.map(it => it.profileId).filter(Boolean),
            products.map(it => it.id).filter(Boolean),
          );

          setNearMeItems(refreshedNearMeItems);
          setCurrentVendorsPage({
            index: 1,
            didReachEnd: vendors.length === 0,
          });
          setCurrentProductsPage({
            index: 1,
            didReachEnd: products.length === 0,
          });

          console.log(
            $FUNC,
            `Fetched ${vendors.length} vendor profile(s)`,
            `and ${products.length} product(s)`,
          );
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

      if (isInitialRender || shouldRefresh) fetchVendorsAndProducts();
    },
    // We only want to run this effect if `inInitialRender` or `shouldRefresh`
    // changes. The other dependencies rely on the result of this effect anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, isInitialRender, shouldRefresh],
  );

  React.useEffect(
    () => {
      async function fetchMoreVendorsAndProducts() {
        try {
          console.log($FUNC, 'Fetching more merchants and products...');

          const fetchVendorsAction = fetchAllProfilesByKind({
            kind: 'vendor',
            pagination: {
              currentPage: currentProductsPage.index,
              limit: VENDOR_PAGINATION_LIMIT,
            },
          });

          const fetchProductsAction = fetchAllProducts({
            reload: shouldRefresh,
            pagination: {
              currentPage: currentProductsPage.index,
              limit: PRODUCT_PAGINATION_LIMIT,
            },
          });

          const [vendors, products] = await Promise.all([
            currentMerchantsPage.didReachEnd
              ? Promise.resolve([])
              : dispatch(fetchVendorsAction).unwrap(),
            currentProductsPage.didReachEnd
              ? Promise.resolve([])
              : dispatch(fetchProductsAction).unwrap(),
          ] as const);

          // Sometimes an `undefined` creeps up here
          const newNearMeItems = shuffleVendorsAndProducts(
            vendors.map(it => it.profileId).filter(Boolean),
            products.map(it => it.id).filter(Boolean),
          );

          setNearMeItems(prev => [...prev, ...newNearMeItems]);
          setCurrentVendorsPage(prev => ({
            index: prev.index + 1,
            didReachEnd: vendors.length === 0,
          }));
          setCurrentProductsPage(prev => ({
            index: prev.index + 1,
            didReachEnd: products.length === 0,
          }));

          console.log(
            $FUNC,
            `Fetched ${vendors.length} more vendor profile(s)`,
            `and ${products.length} more product(s)`,
          );
        } catch (error) {
          console.error($FUNC, 'Failed to fetch near me items:', error);
          alertSomethingWentWrong();
        } finally {
          if (isMounted.current) setShouldFetchMore(false);
        }
      }

      if (shouldFetchMore) fetchMoreVendorsAndProducts();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, shouldFetchMore],
  );

  const handleRefresh = () => {
    if (!isInitialRender && !shouldFetchMore && !shouldRefresh)
      setShouldRefresh(true);
  };

  const handleFetchMore = () => {
    if (!isInitialRender && !shouldFetchMore && !didReachEndFeed)
      setShouldFetchMore(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <SearchLocationOptions />
      <MasonryList
        data={nearMeItems}
        onEndReached={handleFetchMore}
        onEndReachedThreshold={0.25}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            tintColor={color.gray500}
            refreshing={
              nearMeItems.length > 0 &&
              !isInitialRender &&
              !shouldFetchMore &&
              shouldRefresh
            }
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          isInitialRender ? (
            <LoadingContainer message="Loading activity near you..." />
          ) : (
            <EmptyContainer message="We couldn't find anything near you. Try refining your search to somewhere more specific" />
          )
        }
        renderItem={({ item: nearMeItem, column }) => {
          if (nearMeItem.type === 'profile') {
            return (
              <VendorProfileItemCard
                key={nearMeItem.item}
                profileId={nearMeItem.item}
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
          !isInitialRender && nearMeItems.length > 0 ? (
            <FeedFooter didReachEnd={didReachEndFeed} />
          ) : undefined
        }
      />
    </View>
  );
}

function SearchLocationOptions() {
  const _ = useAppSelector(state => state.settings.locationQueryPrefs);
  const bottomSheetRef = React.useRef<BottomSheet>(null);

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
        <Text style={[font.smallBold]}>Searching in default location</Text>
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
