import React, { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

import { createSelector } from '@reduxjs/toolkit';

import { EmptyContainer, LoadingContainer, MasonryList } from 'src/components';
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
import { Pagination } from 'src/models/common';

const PAGINATION_LIMIT = 5;
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
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(true);
  const [shouldFetchMore, setShouldFetchMore] = useState(false);

  const [didReachEndMerchants, setDidReachEndMerchants] = useState(false);
  const [didReachEndProducts, setDidReachEndProducts] = useState(false);
  const [merchantsCurrentPage, setMerchantsCurrentPage] = useState(0);
  const [productsCurrentPage, setProductsCurrentPage] = useState(0);

  useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          console.log('Fetching merchants and products...');
          setMerchantsCurrentPage(0);
          setProductsCurrentPage(0);

          const pagination: Pagination = {
            limit: PAGINATION_LIMIT,
            currentPage: 0,
          };

          await Promise.all([
            dispatch(fetchAllMerchants({ pagination, reload: true })).unwrap(),
            dispatch(fetchAllProducts({ pagination, reload: true })).unwrap(),
          ]);
        } catch (error) {
          console.error(
            $FUNC,
            'Failed to fetch merchants and products:',
            error,
          );
        } finally {
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [dispatch, isMounted, isInitialRender, shouldRefresh]);

  useEffect(() => {
    if (shouldFetchMore)
      (async () => {
        try {
          console.log(
            `Fetching next merchants (page ${merchantsCurrentPage}) and`,
            `products (page ${productsCurrentPage})...`,
          );

          const [merchants, products] = await Promise.all([
            didReachEndMerchants
              ? Promise.resolve([])
              : dispatch(
                  fetchAllMerchants({
                    pagination: {
                      limit: PAGINATION_LIMIT,
                      currentPage: merchantsCurrentPage,
                    },
                  }),
                ).unwrap(),
            didReachEndProducts
              ? Promise.resolve([])
              : dispatch(
                  fetchAllProducts({
                    pagination: {
                      limit: PAGINATION_LIMIT,
                      currentPage: productsCurrentPage,
                    },
                  }),
                ).unwrap(),
          ]);

          if (merchants.length === 0) {
            console.log($FUNC, 'Reached end of merchants');
            setDidReachEndMerchants(true);
          } else {
            console.log($FUNC, `Found ${merchants.length} more merchants`);
          }

          if (products.length === 0) {
            console.log($FUNC, 'Reached end of products');
            setDidReachEndProducts(true);
          } else {
            console.log($FUNC, `Found ${products.length} more products`);
          }
        } catch (error) {
          setMerchantsCurrentPage(curr => curr - 1);
          setProductsCurrentPage(curr => curr - 1);

          console.error(
            $FUNC,
            'Failed to fetch more merchants and products:',
            error,
          );
        } finally {
          if (isMounted) {
            if (shouldFetchMore) setShouldFetchMore(false);
          }
        }
      })();
  }, [
    dispatch,
    isMounted,
    shouldFetchMore,
    // merchantsCurrentPage,
    // productsCurrentPage,
    // didReachEndMerchants,
    // didReachEndProducts,
  ]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const handleEndReached = () => {
    setShouldFetchMore(true);
    setMerchantsCurrentPage(curr => curr + 1);
    setProductsCurrentPage(curr => curr + 1);
  };

  return (
    <MasonryList
      data={nearMeItems}
      onEndReached={handleEndReached}
      onEndReachedThreshold={1}
      refreshControl={
        <RefreshControl
          title="Loading activity near you..."
          tintColor={color.gray500}
          titleColor={color.gray700}
          refreshing={!isInitialRender && shouldRefresh}
          onRefresh={handleRefresh}
        />
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
