import React, { useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, Text, View } from 'react-native';

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
import { fetchProductsForMerchant } from '../products/productsSlice';
import { values } from '../../constants';

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @typedef {{ merchant: Merchant }} MerchantProfileScreenProps
 * @param {MerchantProfileScreenProps} param0
 */
export default function MerchantProfileScreen() {
  const dispatch = useDispatch();

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

  /**
   * @typedef {import('../../models').ProductId} ProductId
   * @type {[ProductId, (value: ProductId) => void]}
   */
  const [productIds, setProductIds] = useState([]);
  const [shouldFetchProducts, setShouldFetchProducts] = useState(true);

  useEffect(() => {
    if (shouldFetchProducts)
      (async () => {
        try {
          console.log('Fetching products for merchant...');
          const merchantId = String(merchant.id);
          /** @type {import('../../models').Product[]} */
          const products = await dispatch(
            fetchProductsForMerchant(merchantId),
          ).unwrap();
          setProductIds(products.map((product) => product.id));
        } catch (error) {
          console.error('Failed to fetch products for merchant:', error);
        } finally {
          setShouldFetchProducts(false);
        }
      })();
  }, [shouldFetchProducts, dispatch]);

  const tileSpacing = values.spacing.sm * 1.25;

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
        <Tabs.Tab name="products" label="Products">
          {/* <Tabs.FlatList
            data={productIds}
            numColumns={2}
            keyExtractor={(item) => String(item)}
            contentContainerStyle={{ paddingBottom: tileSpacing }}
            ListEmptyComponent={
              <EmptyTabView
                message={`Looks like ${
                  merchant.shortName || 'this profile'
                } doesn't have any products yet`}
              />
            }
            renderItem={({ item: productId, index }) => (
              <View style={{ flex: 0.5 }}>
                <ProductItemCard
                  productId={productId}
                  style={{
                    marginTop: tileSpacing,
                    marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
                    marginRight:
                      index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
                  }}
                />
              </View>
            )}
          /> */}
          <Tabs.ScrollView>
            <MasonryList
              data={productIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={`Looks like ${
                    merchant.shortName || 'this profile'
                  } doesn't have any products yet`}
                />
              }
              renderItem={({ item: productId, index }) => (
                <ProductItemCard
                  productId={productId}
                  style={{
                    marginTop: tileSpacing,
                    marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
                    marginRight:
                      index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
                  }}
                />
              )}
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
    </SafeAreaView>
  );
}
