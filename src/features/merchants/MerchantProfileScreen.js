import React, { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView } from 'react-native';

import analytics from '@react-native-firebase/analytics';
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import NoteMasonryList from '../../components/masonry/NoteMasonryList';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import ProductItemCard from '../products/ProductItemCard';
import { EmptyTabView, MasonryList, RouteError } from '../../components';

import { selectAllNotes } from '../notes/notesSlice';
import { selectPostsByProfile } from '../posts/postsSlice';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';
import { useIsMounted } from '../../hooks';
import { colors, values } from '../../constants';

import {
  selectMerchantById,
  selectTotalLikesForMerchant,
  updateMerchantViewCounter,
} from './merchantsSlice';

import {
  HEADER_MAX_HEIGHT,
  ProfileScreenHeader,
} from '../profiles/ProfileScreen';

import {
  fetchProductsForMerchant,
  selectProductsForMerchant,
} from '../products/productsSlice';

// TODO: Refactor out
function isOverFiveMinutes(date) {
  if (!date) return false;

  const FIVE_MINS = 5 * 60 * 1000;
  const now = new Date();
  const then = new Date(date);
  return now - then > FIVE_MINS;
}

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @param {{ merchant: Merchant }} param0
 * @returns
 */
function ProductsTab({ merchant }) {
  const FUNC = '[MerchantProfileScreen.ProductsTab]';
  const dispatch = useDispatch();

  const merchantId = String(merchant.id);
  const products = useSelector((state) =>
    selectProductsForMerchant(state, merchantId),
  );

  const productIds = useMemo(
    () => products.map((product) => product.id),
    [products],
  );

  /** @type {import('../../api').ApiFetchStatus} */
  const { status: fetchStatus /* error: fetchError */ } = useSelector(
    (state) => state.products,
  );

  const isMounted = useIsMounted();
  const tileSpacing = useMemo(() => values.spacing.sm * 1.25, []);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    if (shouldRefresh || isInitialRender)
      (async () => {
        try {
          await dispatch(
            fetchProductsForMerchant({ merchantId, reload: true }),
          ).unwrap();
        } catch (error) {
          console.error(FUNC, 'Failed to fetch products for merchant:', error);
          Alert.alert(
            SOMETHING_WENT_WRONG.title,
            "We weren't able to get products for you. Please try again later.",
          );
        } finally {
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [isInitialRender, shouldRefresh]);

  useEffect(() => {
    if (fetchStatus === 'fulfilled' && products.length > 0)
      (async () => {
        try {
          await analytics().logViewItemList({
            items: products.map((product) => ({
              item_id: product.id,
              item_name: product.name,
              item_list_name: merchant.shortName,
            })),
          });
        } catch (error) {
          console.error(FUNC, 'Failed to send `view_item_list` event:', error);
        }
      })();
  }, [products, fetchStatus]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  return (
    <MasonryList
      data={productIds}
      refreshControl={
        <RefreshControl
          title="Loading products..."
          refreshing={
            !isInitialRender && (fetchStatus === 'refreshing' || shouldRefresh)
          }
          onRefresh={handleRefresh}
        />
      }
      ScrollViewComponent={Tabs.ScrollView}
      ListEmptyComponent={
        <EmptyTabView
          message={`${
            merchant.shortName || 'this merchant'
          } doesn't have any products yet`}
        />
      }
      contentContainerStyle={{ paddingBottom: tileSpacing * 2 }}
      renderItem={({ item: productId, column }) => (
        <ProductItemCard
          productId={productId}
          key={productId.toString()}
          style={{
            marginTop: tileSpacing,
            marginLeft: column % 2 === 0 ? tileSpacing : tileSpacing / 2,
            marginRight: column % 2 !== 0 ? tileSpacing : tileSpacing / 2,
          }}
        />
      )}
    />
  );
}

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @typedef {{ merchant: Merchant }} MerchantProfileScreenProps
 * @param {MerchantProfileScreenProps} param0
 */
export default function MerchantProfileScreen() {
  const $FUNC = '[MerchantProfileScreen]';
  const dispatch = useDispatch();

  /** @type {{ merchantId: import('../../models').MerchantId }} */
  const { merchantId } = useRoute().params ?? {};
  const merchant = useSelector((state) =>
    selectMerchantById(state, merchantId),
  );

  // TODO: Try to fetch merchant before returning error
  if (!merchant) {
    console.warn($FUNC, 'Failed to select merchant with id:', merchantId);
    return <RouteError />;
  }

  const profileId = merchant.profileId;

  const postIds = profileId
    ? useSelector((state) =>
        selectPostsByProfile(state, profileId).map((post) => post.id),
      )
    : [];

  const noteIds = profileId
    ? useSelector((state) => {
        return selectAllNotes(state)
          .filter((note) => note.isPublic && note.profileId === profileId)
          .map((note) => note.id);
      })
    : [];

  const totalLikes = useSelector((state) =>
    selectTotalLikesForMerchant(state, merchantId),
  );

  useEffect(() => {
    const { lastViewed } = merchant.statistics ?? {};

    // We don't want to count views in development mode
    if ((!__DEV__ && !lastViewed) || isOverFiveMinutes(lastViewed)) {
      console.log($FUNC, 'Updating last viewed date-time...');
      dispatch(
        updateMerchantViewCounter({
          merchantId,
          lastViewed: new Date().toJSON(),
        }),
      );
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs.Container
        lazy
        snapThreshold={0.25}
        headerHeight={HEADER_MAX_HEIGHT}
        renderHeader={() => (
          <ProfileScreenHeader
            profileDetails={{
              ...merchant,
              fullName: merchant.shortName,
              isVendor: true,
              address: merchant.address,
              totalLikes,
            }}
          />
        )}
        TabBarComponent={(props) => (
          <MaterialTabBar
            {...props}
            activeColor={colors.black}
            inactiveColor={colors.gray700}
            indicatorStyle={{ backgroundColor: colors.accent }}
          />
        )}>
        <Tabs.Tab name="products" label="Products">
          <ProductsTab merchant={merchant} />
        </Tabs.Tab>
        <Tabs.Tab name="posts" label="Posts">
          <Tabs.ScrollView>
            <PostMasonryList
              smallContent
              nestedScrollEnabled
              showFooter={false}
              postIds={postIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={`${
                    merchant.shortName || 'This profile'
                  } hasn't posted anything yet`}
                />
              }
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="notes" label="Notes">
          <Tabs.ScrollView>
            <NoteMasonryList
              smallContent
              nestedScrollEnabled
              showFooter={false}
              noteIds={noteIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={`${
                    merchant.shortName || 'This profile'
                  } hasn't shared any public notes yet`}
                />
              }
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
    </SafeAreaView>
  );
}
