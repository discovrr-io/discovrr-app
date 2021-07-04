import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { ProductApi } from '../../api';

/**
 * @typedef {import('../../models').Product} Product
 * @type {import("@reduxjs/toolkit").EntityAdapter<Product>}
 */
const productsAdapter = createEntityAdapter();

export const fetchProductsForMerchant = createAsyncThunk(
  'products/fetchProductsForMerchant',
  ProductApi.fetchProductsForMerchant,
);

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
  reducers: {},
  extraReducers: (builder) => {
    // -- fetchProductsForMerchant --
    builder
      .addCase(fetchProductsForMerchant.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(fetchProductsForMerchant.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        productsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchProductsForMerchant.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
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
