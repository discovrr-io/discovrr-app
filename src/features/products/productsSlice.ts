import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { ApiFetchStatus, ApiFetchStatuses, ProductApi } from 'src/api';
import { resetAppState } from 'src/globalActions';
import { MerchantId, Product, ProductId } from 'src/models';
import { Pagination } from 'src/models/common';
import { RootState } from 'src/store';

//#region Product Adapter Initialization

export type ProductsState = EntityState<Product> & ApiFetchStatuses;

const productsAdapter = createEntityAdapter<Product>();

const initialState = productsAdapter.getInitialState<ApiFetchStatuses>({
  statuses: {},
});

//#endregion Product Adapter Initialization

//#region Product Async Thunks

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

type FetchProductByIdParams = {
  productId: ProductId;
  reload?: boolean;
};

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async ({ productId }: FetchProductByIdParams) =>
    ProductApi.fetchProductById(String(productId)),
);

type UpdateProductLikeStatusParams = {
  productId: ProductId;
  didLike: boolean;
};

export const updateProductLikeStatus = createAsyncThunk(
  'products/updateProductLikeStatus',
  async ({ productId, didLike }: UpdateProductLikeStatusParams) =>
    ProductApi.updateProductLikeStatus(String(productId), didLike),
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

//#endregion Product Async Thunks

//#region Product Slice

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
  extraReducers: builder => {
    builder
      .addCase(resetAppState, state => {
        console.log('Purging products...');
        Object.assign(state, initialState);
      })
      // -- fetchProductById --
      .addCase(fetchProductById.pending, (state, action) => {
        const { productId, reload } = action.meta.arg;
        state.statuses[String(productId)] = {
          status: reload ? 'refreshing' : 'pending',
          error: undefined,
        };
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        if (action.payload) productsAdapter.upsertOne(state, action.payload);
        state.statuses[String(action.meta.arg.productId)] = {
          status: 'fulfilled',
          error: undefined,
        };
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.statuses[String(action.meta.arg.productId)] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- fetchAllProducts --
      // .addCase(fetchAllProducts.pending, (state, action) => {
      //   const { reload = false } = action.meta.arg ?? {}; // `??` may not be necessary
      //   for (const productId of Object.keys(state.statuses)) {
      //     state.statuses[productId] = {
      //       status: reload ? 'refreshing' : 'pending',
      //     };
      //   }
      // })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          productsAdapter.setAll(state, action.payload);
        } else {
          productsAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const productId of action.payload.map(product => product.id)) {
          state.statuses[String(productId)] = { status: 'fulfilled' };
        }
      })
      // .addCase(fetchAllProducts.rejected, (state, action) => {
      //   for (const productId of Object.keys(state.statuses)) {
      //     state.statuses[productId] = {
      //       status: 'rejected',
      //       error: action.error,
      //     };
      //   }
      // })
      // -- fetchProductsForMerchant --
      // .addCase(fetchProductsForMerchant.pending, (state, action) => {
      //   const { reload = false } = action.meta.arg ?? {};
      //   for (const productId of Object.keys(state.statuses)) {
      //     state.statuses[productId] = {
      //       status: reload ? 'refreshing' : 'pending',
      //     };
      //   }
      // })
      .addCase(fetchProductsForMerchant.fulfilled, (state, action) => {
        productsAdapter.upsertMany(state, action.payload);
        for (const productId of action.payload.map(productId => productId.id)) {
          state.statuses[String(productId)] = { status: 'fulfilled' };
        }
      })
      // .addCase(fetchProductsForMerchant.rejected, (state, action) => {
      //   for (const productId of Object.keys(state.statuses)) {
      //     state.statuses[productId] = {
      //       status: 'rejected',
      //       error: action.error,
      //     };
      //   }
      // })
      // -- updateProductLikeStatus --
      .addCase(updateProductLikeStatus.pending, (state, action) => {
        productsSlice.caseReducers.productLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(updateProductLikeStatus.rejected, (state, action) => {
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

//#endregion Product Slice

//#region Custom Product Selectors

export const {
  selectAll: selectAllProducts,
  selectById: selectProductById,
  selectIds: selectProductIds,
} = productsAdapter.getSelectors<RootState>(state => state.products);

export function selectProductStatusById(
  state: RootState,
  productId: ProductId,
): ApiFetchStatus {
  return state.products.statuses[String(productId)] ?? { status: 'idle' };
}

export const selectProductsForMerchant = createSelector(
  [
    selectAllProducts,
    (_state: RootState, merchantId: MerchantId) => merchantId,
  ],
  (products, merchantId) => {
    return products.filter(product => product.merchantId === merchantId);
  },
);

//#endregion Custom Product Selectors

export default productsSlice.reducer;
