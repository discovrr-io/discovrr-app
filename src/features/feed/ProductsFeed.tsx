import * as React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { DEFAULT_TILE_SPACING } from 'src/constants/values';
import { fetchAllProducts } from 'src/features/products/products-slice';
import { ProductId } from 'src/models';
import { FeedTopTabScreenProps } from 'src/navigation';

import {
  Button,
  EmptyContainer,
  LoadingContainer,
  LocationQueryBottomSheet,
  MasonryList,
  Spacer,
} from 'src/components';

import {
  useAppDispatch,
  useAppSelector,
  useExtendedTheme,
  useIsMounted,
} from 'src/hooks';

import FeedFooter from './FeedFooter';
import ProductItemCard from 'src/features/products/ProductItemCard';

const PRODUCT_PAGINATION_LIMIT = 18;
const TILE_SPACING = DEFAULT_TILE_SPACING;

type CurrentPage = {
  index: number;
  didReachEnd: boolean;
};

type ProductsFeedProps = FeedTopTabScreenProps<'ProductsFeed'>;

export default function ProductsFeed(_: ProductsFeedProps) {
  const $FUNC = '[ProductsFeed]';
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const [productIds, setProductIds] = React.useState<ProductId[]>([]);
  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);
  const [shouldFetchMore, setShouldFetchMore] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<CurrentPage>({
    index: 0,
    didReachEnd: false,
  });

  const didReachEndFeed = React.useMemo(() => {
    return currentPage.didReachEnd;
  }, [currentPage]);

  React.useEffect(
    () => {
      async function fetchProducts() {
        try {
          console.log($FUNC, 'Fetching products...');
          setCurrentPage({ index: 0, didReachEnd: false });

          const fetchProductsAction = fetchAllProducts({
            reload: shouldRefresh,
            pagination: {
              currentPage: 0,
              limit: PRODUCT_PAGINATION_LIMIT,
            },
          });

          const products = await dispatch(fetchProductsAction).unwrap();

          // Here we shuffle by the product IDs, which are random enough anyway.
          // Sorting like this should provide a good enough "randomised" result.
          const shuffledProductIds = products
            .map(item => item.id)
            .filter(Boolean) // Sometimes an `undefined` creeps up here
            .slice() // We don't want to mutate the original array.
            .sort((a, b) => String(a).localeCompare(String(b)));

          setProductIds(shuffledProductIds);
          setCurrentPage({
            index: 1,
            didReachEnd: shuffledProductIds.length === 0,
          });

          console.log($FUNC, `Fetched ${shuffledProductIds.length} product(s)`);
        } catch (error) {
          console.error($FUNC, 'Failed to fetch products:', error);
          utilities.alertSomethingWentWrong();
        } finally {
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      }

      if (isInitialRender || shouldRefresh) fetchProducts();
    },
    // We only want to run this effect if `inInitialRender` or `shouldRefresh`
    // changes. The other dependencies rely on the result of this effect anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, isInitialRender, shouldRefresh],
  );

  React.useEffect(
    () => {
      async function fetchMoreProducts() {
        try {
          console.log($FUNC, 'Fetching more products...');

          const fetchProductsAction = fetchAllProducts({
            reload: shouldRefresh,
            pagination: {
              currentPage: currentPage.index,
              limit: PRODUCT_PAGINATION_LIMIT,
            },
          });

          const products = await dispatch(fetchProductsAction).unwrap();
          const shuffledProductIds = products
            .map(item => item.id)
            .filter(Boolean) // Sometimes an `undefined` creeps up here
            .slice() // We don't want to mutate the original array.
            .sort((a, b) => String(a).localeCompare(String(b)));

          setProductIds(prev => [...prev, ...shuffledProductIds]);
          setCurrentPage(prev => ({
            index: prev.index + 1,
            didReachEnd: shuffledProductIds.length === 0,
          }));

          console.log(
            $FUNC,
            `Fetched ${shuffledProductIds.length} more product(s)`,
          );
        } catch (error) {
          console.error($FUNC, 'Failed to fetch products items:', error);
          utilities.alertSomethingWentWrong();
        } finally {
          if (isMounted.current) setShouldFetchMore(false);
        }
      }

      if (shouldFetchMore) fetchMoreProducts();
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
        data={productIds}
        onEndReached={handleFetchMore}
        onEndReachedThreshold={0.25}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            tintColor={constants.color.gray500}
            refreshing={
              productIds.length > 0 &&
              !isInitialRender &&
              !shouldFetchMore &&
              shouldRefresh
            }
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          isInitialRender ? (
            <LoadingContainer message="Loading products..." />
          ) : (
            <EmptyContainer message="We couldn't find any products. Try refining your filters." />
          )
        }
        renderItem={({ item: productId, column }) => (
          <ProductItemCard
            key={String(productId)}
            productId={productId}
            elementOptions={{ smallContent: true }}
            style={{
              marginTop: TILE_SPACING,
              marginLeft: column % 2 === 0 ? TILE_SPACING : TILE_SPACING / 2,
              marginRight: column % 2 !== 0 ? TILE_SPACING : TILE_SPACING / 2,
            }}
          />
        )}
        ListFooterComponent={
          !isInitialRender && productIds.length > 0 ? (
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
  const { colors } = useExtendedTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: constants.layout.spacing.sm,
        paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="location" size={18} color={colors.text} />
        <Spacer.Horizontal value={constants.layout.spacing.xs} />
        <Text
          numberOfLines={1}
          style={[constants.font.smallBold, { color: colors.text }]}>
          Default location
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
