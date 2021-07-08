import React, { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView } from 'react-native';

import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import NoteMasonryList from '../../components/masonry/NoteMasonryList';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import ProductItemCard from '../products/ProductItemCard';
import { EmptyTabView, LoadingTabView, MasonryList } from '../../components';
import { ProfileScreenHeader } from '../profiles/ProfileScreen';

import { selectAllNotes } from '../notes/notesSlice';
import { selectPostsByProfile } from '../posts/postsSlice';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';
import { useIsMounted } from '../../hooks';
import { colors, values } from '../../constants';

import {
  fetchProductsForMerchant,
  selectProductsForMerchant,
} from '../products/productsSlice';

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @param {{ merchant: Merchant }} param0
 * @returns
 */
function ProductsTab({ merchant }) {
  const dispatch = useDispatch();

  // /**
  //  * @typedef {import('../../models').ProductId} ProductId
  //  * @type {[ProductId, (value: ProductId) => void]}
  //  */
  // const [productIds, setProductIds] = useState([]);
  // const [shouldRefresh, setShouldRefresh] = useState(true);

  // useEffect(() => {
  //   if (shouldRefresh)
  //     (async () => {
  //       try {
  //         console.log('[ProductsTab] Fetching products for merchant...');
  //         /** @type {import('../../models').Product[]} */
  //         const products = await dispatch(
  //           fetchProductsForMerchant(String(merchant.id)),
  //         ).unwrap();
  //         setProductIds(products.map((product) => product.id));
  //         // await dispatch(fetchProductsForMerchant(merchantId)).unwrap();
  //       } catch (error) {
  //         console.error(
  //           '[ProductsTab] Failed to fetch products for merchant:',
  //           error,
  //         );
  //       } finally {
  //         setShouldRefresh(false);
  //       }
  //     })();
  // }, [shouldRefresh, dispatch]);

  const merchantId = String(merchant.id);
  const productIds = useSelector((state) =>
    selectProductsForMerchant(state, merchantId).map((product) => product.id),
  );

  /** @type {import('../../api').ApiFetchStatus} */
  const { status: fetchStatus /* error: fetchError */ } = useSelector(
    (state) => state.products,
  );

  const isMounted = useIsMounted();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (isInitialLoad || shouldRefresh)
      (async () => {
        try {
          await dispatch(fetchProductsForMerchant(merchantId)).unwrap();
        } catch (error) {
          console.error(
            '[MerchantProfileScreen] Failed to fetch products for merchant:',
            error,
          );
          isMounted.current && setFetchError(error);
          Alert.alert(
            SOMETHING_WENT_WRONG.title,
            "We weren't able to get products for you. Please try again later.",
          );
        } finally {
          if (isMounted.current) {
            if (isInitialLoad) setIsInitialLoad(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [isInitialLoad, shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const tileSpacing = useMemo(() => values.spacing.sm * 1.25, []);

  if (isInitialLoad) {
    return <LoadingTabView message="Loading products..." />;
  }

  return (
    <MasonryList
      data={productIds}
      ListEmptyComponent={
        fetchError ? (
          <ErrorTabView
            caption={`We weren't able to get products for ${
              merchant.shortName || 'this merchant'
            }.`}
            error={fetchError}
          />
        ) : (
          <EmptyTabView
            message={`${
              merchant.shortName || 'this merchant'
            } doesn't have any products yet`}
          />
        )
      }
      refreshControl={
        <RefreshControl
          title="Loading products..."
          refreshing={fetchStatus === 'refreshing' || shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
      contentContainerStyle={{ paddingBottom: tileSpacing }}
      renderItem={({ item: productId, index }) => (
        <ProductItemCard
          productId={productId}
          key={String(productId)}
          style={{
            marginTop: tileSpacing,
            marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
            marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
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
  /** @type {{ merchant: Merchant }} */
  const { merchant } = useRoute().params ?? {};

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs.Container
        lazy
        snapThreshold={0.25}
        HeaderComponent={() => (
          <ProfileScreenHeader
            profileDetails={{
              ...merchant,
              fullName: merchant.shortName,
              isVendor: true,
              address: merchant.address,
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
          <Tabs.ScrollView>
            <ProductsTab merchant={merchant} />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="posts" label="Posts">
          <Tabs.ScrollView /* refreshControl={<RefreshControl />} */>
            <PostMasonryList
              smallContent
              showFooter={false}
              postIds={postIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={`Looks like ${
                    merchant.shortName || 'this profile'
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
              showFooter={false}
              noteIds={noteIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={`Looks like ${
                    merchant.shortName || 'this profile'
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
