import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { ProductApi } from '../../api';

export const fetchAllProducts = createAsyncThunk(
  'products/fetchAllProducts',
  /**
   * @typedef {import('../../models/common').Pagination} Pagination
   * @param {{ pagination?: Pagination, reload?: boolean }=} param0
   */
  async ({ pagination } = {}) => ProductApi.fetchAllProducts(pagination),
);

export const fetchProductsForMerchant = createAsyncThunk(
  'products/fetchProductsForMerchant',
  /**
   * @typedef {import('../../models').MerchantId} MerchantId
   * @param {{ merchantId: MerchantId, reload?: boolean }} param0
   * @returns
   */
  async ({ merchantId }) => ProductApi.fetchProductsForMerchant(merchantId),
);

export const changeProductLikeStatus = createAsyncThunk(
  'products/changeProductLikeStatus',
  /**
   * @typedef {import('../../models').ProductId} ProductId
   * @param {{ productId: ProductId, didLike: boolean }} param0
   */
  async ({ productId, didLike }) =>
    ProductApi.changeProductLikeStatus(productId, didLike),
);

/**
 * @typedef {import('../../models').Product} Product
 * @type {import("@reduxjs/toolkit").EntityAdapter<Product>}
 */
const productsAdapter = createEntityAdapter();

/**
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Product>} ProductEntityState
 * @type {ProductEntityState & ApiFetchStatus}
 */
const initialState = productsAdapter.getInitialState({
  status: 'idle',
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    /**
     * @typedef {{ productId: ProductId, didLike: boolean }} Payload
     * @param {import('@reduxjs/toolkit').PayloadAction<Payload>} action
     */
    productLikeStatusChanged: (state, action) => {
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
      // -- fetchAllProducts --
      .addCase(fetchAllProducts.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
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
        state.status = 'pending';
        productsSlice.caseReducers.productLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(changeProductLikeStatus.rejected, (state, action) => {
        state.status = 'rejected';
        const oldLike = !action.meta.arg.didLike;
        productsSlice.caseReducers.productLikeStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didLike: oldLike },
        });
      });
  },
});

export const {} = productsSlice.actions;

export const {
  selectAll: selectAllProducts,
  selectById: selectProductById,
  selectIds: selectProductIds,
} = productsAdapter.getSelectors((state) => state.products);

export const selectProductsForMerchant = createSelector(
  [selectAllProducts, (_state, merchantId) => merchantId],
  (products, merchantId) => {
    return products.filter((product) => product.merchantId === merchantId);
  },
);

export default productsSlice.reducer;
