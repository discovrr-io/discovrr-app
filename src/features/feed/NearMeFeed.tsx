import React, { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

import { createSelector } from '@reduxjs/toolkit';

import { MasonryList } from 'src/components';
import { color } from 'src/constants';
import { DEFAULT_TILE_SPACING } from 'src/constants/values';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { MerchantId, NearMeItem, ProductId } from 'src/models';

import MerchantItemCard from 'src/features/merchants/MerchantItemCard';
import ProductItemCard from 'src/features/products/ProductItemCard';

import {
  fetchAllMerchants,
  selectMerchantIds,
} from 'src/features/merchants/merchantsSlice';

import {
  fetchAllProducts,
  selectProductIds,
} from 'src/features/products/productsSlice';

const TILE_SPACING = DEFAULT_TILE_SPACING;

const selectNearMeItems = createSelector(
  [selectMerchantIds, selectProductIds],
  (allMerchantIds, allProductIds) => {
    // The current merchant index
    let curr = 0;

    // Here we shuffle all products before processing them. This isn't an
    // efficient solution, but this is a temporary solution for a temporary
    // feature.
    const shuffledProductIds = allProductIds
      .map(product => ({ sort: Math.random(), product }))
      .sort((a, b) => a.sort - b.sort)
      .map(a => a.product);

    const nearMeItems: NearMeItem[] = shuffledProductIds.flatMap(
      (productId, idx) => {
        if (idx % 2 === 0) {
          const merchantId = allMerchantIds[curr];
          if (curr < allMerchantIds.length) curr += 1;

          return [
            { type: 'product', item: productId as ProductId },
            { type: 'merchant', item: merchantId as MerchantId },
          ];
        } else {
          return { type: 'product', item: productId as ProductId };
        }
      },
    );

    return nearMeItems;
  },
);

export default function NearMeFeed() {
  const $FUNC = '[NearMeFeed]';
  const dispatch = useAppDispatch();
  const nearMeItems = useAppSelector(selectNearMeItems);

  const isMounted = useIsMounted();
  const [shouldRefresh, setShouldRefresh] = useState(true);

  useEffect(() => {
    if (shouldRefresh)
      (async () => {
        console.log('Fetching merchants and products...');
        try {
          await Promise.all([
            dispatch(fetchAllMerchants()).unwrap(),
            dispatch(fetchAllProducts()).unwrap(),
          ]);
        } catch (error) {
          console.error(
            $FUNC,
            'Failed to select merchants and products:',
            error,
          );
        } finally {
          if (isMounted.current) setShouldRefresh(false);
        }
      })();
  }, [dispatch, isMounted, shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  return (
    <MasonryList
      data={nearMeItems}
      refreshControl={
        <RefreshControl
          title="Loading activity near you..."
          tintColor={color.gray500}
          titleColor={color.gray700}
          refreshing={shouldRefresh}
          onRefresh={handleRefresh}
        />
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
                marginLeft: column % 2 === 0 ? TILE_SPACING : TILE_SPACING / 2,
                marginRight: column % 2 !== 0 ? TILE_SPACING : TILE_SPACING / 2,
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
                marginLeft: column % 2 === 0 ? TILE_SPACING : TILE_SPACING / 2,
                marginRight: column % 2 !== 0 ? TILE_SPACING : TILE_SPACING / 2,
              }}
            />
          );
        }
      }}
    />
  );
}
