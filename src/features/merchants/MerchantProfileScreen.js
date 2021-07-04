import React, { useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView } from 'react-native';

import { Tabs } from 'react-native-collapsible-tab-view';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import NoteMasonryList from '../../components/masonry/NoteMasonryList';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import ProductItemCard from '../products/ProductItemCard';
import { EmptyTabView, MasonryList } from '../../components';
import { ProfileScreenHeader } from '../profiles/ProfileScreen';

import { selectPostsByProfile } from '../posts/postsSlice';
import { selectAllNotes } from '../notes/notesSlice';
import { values } from '../../constants';

import {
  fetchProductsForMerchant,
  // selectProductsForMerchant,
} from '../products/productsSlice';

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @param {{ merchant: Merchant }} param0
 * @returns
 */
function ProductsTab({ merchant }) {
  const dispatch = useDispatch();

  /**
   * @typedef {import('../../models').ProductId} ProductId
   * @type {[ProductId, (value: ProductId) => void]}
   */
  const [productIds, setProductIds] = useState([]);
  const [shouldRefresh, setShouldRefresh] = useState(true);

  // const merchantId = String(merchant.id);
  // const productIds = useSelector((state) =>
  //   selectProductsForMerchant(state, merchantId),
  // );

  // /** @type {import('../../api').ApiFetchStatus} */
  // const { status: fetchStatus, error: fetchError } = useSelector(
  //   (state) => state.products,
  // );

  useEffect(() => {
    if (shouldRefresh)
      (async () => {
        try {
          console.log('[ProductsTab] Fetching products for merchant...');
          /** @type {import('../../models').Product[]} */
          const products = await dispatch(
            fetchProductsForMerchant(String(merchant.id)),
          ).unwrap();
          setProductIds(products.map((product) => product.id));
          // await dispatch(fetchProductsForMerchant(merchantId)).unwrap();
        } catch (error) {
          console.error(
            '[ProductsTab] Failed to fetch products for merchant:',
            error,
          );
        } finally {
          setShouldRefresh(false);
        }
      })();
  }, [shouldRefresh, dispatch]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const tileSpacing = values.spacing.sm * 1.25;

  return (
    <MasonryList
      data={productIds}
      ListEmptyComponent={
        <EmptyTabView
          message={`Looks like ${
            merchant.shortName || 'this profile'
          } doesn't have any products yet`}
        />
      }
      refreshControl={
        <RefreshControl
          title="Loading products..."
          refreshing={/* fetchStatus === 'pending' || */ shouldRefresh}
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
            }}
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
