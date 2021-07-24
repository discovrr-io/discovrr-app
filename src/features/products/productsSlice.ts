import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { PURGE } from 'redux-persist';

import { ApiFetchStatus, ProductApi } from '../../api';
import { MerchantId, Product, ProductId } from '../../models';
import { Pagination } from '../../models/common';
import { RootState } from '../../store';

type FetchAllProductsParams = {
  pagination?: Pagination;
  reload?: boolean;
};

export const fetchAllProducts = createAsyncThunk(
  'products/fetchAllProducts',
  async ({ pagination }: FetchAllProductsParams = {}) =>
    ProductApi.fetchAllProducts(pagination),
);

type FetchProductsForMerchantParams = {
  merchantId: MerchantId;
  reload?: boolean;
};

export const fetchProductsForMerchant = createAsyncThunk(
  'products/fetchProductsForMerchant',
  async ({ merchantId }: FetchProductsForMerchantParams) =>
    ProductApi.fetchProductsForMerchant(String(merchantId)),
);

type ChangeProductLikeStatusParams = {
  productId: ProductId;
  didLike: boolean;
};

export const changeProductLikeStatus = createAsyncThunk(
  'products/changeProductLikeStatus',
  async ({ productId, didLike }: ChangeProductLikeStatusParams) =>
    ProductApi.changeProductLikeStatus(String(productId), didLike),
);

type UpdateProductViewCounterParams = {
  productId: ProductId;
  lastViewed?: string;
};

export const updateProductViewCounter = createAsyncThunk(
  'products/updateProductViewCounter',
  async ({ productId }: UpdateProductViewCounterParams) =>
    ProductApi.updateProductViewCounter(String(productId)),
);

export type ProductsState = EntityState<Product> & ApiFetchStatus;

const productsAdapter = createEntityAdapter<Product>();

const initialState = productsAdapter.getInitialState<ApiFetchStatus>({
  status: 'idle',
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    updateProduct: productsAdapter.updateOne,
    productLikeStatusChanged: (
      state,
      action: PayloadAction<{ productId: ProductId; didLike: boolean }>,
    ) => {
      const { productId, didLike } = action.payload;
      const existingProduct = state.entities[productId];
      if (existingProduct && existingProduct.statistics) {
        existingProduct.statistics.didLike = didLike;
        existingProduct.statistics.totalLikes += didLike ? 1 : -1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(PURGE, (state) => {
        console.log('Purging products...');
        Object.assign(state, initialState);
      })
      // -- fetchAllProducts --
      .addCase(fetchAllProducts.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {}; // `??` may not be necessary
        state.status = reload ? 'refreshing' : 'pending';
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        const { reload = false } = action.meta.arg ?? {};
        if (reload) {
          productsAdapter.setAll(state, action.payload);
        } else {
          productsAdapter.upsertMany(state, action.payload);
        }
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- fetchProductsForMerchant --
      .addCase(fetchProductsForMerchant.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        state.status = reload ? 'refreshing' : 'pending';
      })
      .addCase(fetchProductsForMerchant.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        productsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchProductsForMerchant.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- changeProductLikeStatus --
      .addCase(changeProductLikeStatus.pending, (state, action) => {
        productsSlice.caseReducers.productLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(changeProductLikeStatus.rejected, (state, action) => {
        const oldLike = !action.meta.arg.didLike;
        productsSlice.caseReducers.productLikeStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didLike: oldLike },
        });
      })
      // -- updateProductViewCounter --
      .addCase(updateProductViewCounter.fulfilled, (state, action) => {
        const { productId, lastViewed = new Date().toJSON() } = action.meta.arg;
        const selectedProduct = state.entities[productId];
        if (selectedProduct) {
          if (selectedProduct.statistics) {
            selectedProduct.statistics.totalViews += 1;
            selectedProduct.statistics.lastViewed = lastViewed;
          } else {
            selectedProduct.statistics = {
              didSave: false,
              didLike: false,
              totalLikes: 0,
              totalViews: 1,
              lastViewed: lastViewed,
            };
          }
        }
      });
  },
});

export const { updateProduct } = productsSlice.actions;

export const {
  selectAll: selectAllProducts,
  selectById: selectProductById,
  selectIds: selectProductIds,
} = productsAdapter.getSelectors<RootState>((state) => state.products);

export const selectProductsForMerchant = createSelector(
  [
    selectAllProducts,
    (_state: RootState, merchantId: MerchantId) => merchantId,
  ],
  (products, merchantId) => {
    return products.filter((product) => product.merchantId === merchantId);
  },
);

export default productsSlice.reducer;
