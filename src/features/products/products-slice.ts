import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { resetAppState } from 'src/global-actions';
import { Product, ProductId, VendorProfileId } from 'src/models';
import { RootState } from 'src/store';

import {
  ApiFetchStatus,
  ApiFetchStatuses,
  ProductApi,
  Reloadable,
} from 'src/api';

//#region Product Adapter Initialization

type ProductApiFetchStatuses = ApiFetchStatuses<ProductId>;
export type ProductsState = EntityState<Product> & ProductApiFetchStatuses;

const productsAdapter = createEntityAdapter<Product>();

const initialState = productsAdapter.getInitialState<ProductApiFetchStatuses>({
  statuses: {},
});

//#endregion Product Adapter Initialization

//#region Product Async Thunks

export const fetchProductById = createAsyncThunk<
  Product,
  Reloadable<ProductApi.FetchProductByIdParams>
>('products/fetchProductById', ProductApi.fetchProductById);

export const fetchAllProducts = createAsyncThunk<
  Product[],
  Reloadable<ProductApi.FetchAllProductsParams>
>('products/fetchAllProducts', ProductApi.fetchAllProducts);

export const fetchProductsForVendorProfile = createAsyncThunk(
  'products/fetchProductsForVendorProfile',
  ProductApi.fetchProductsForVendorProfile,
);

// export const updateProductLikeStatus = createAsyncThunk(
//   'products/updateProductLikeStatus',
//   ProductApi.updateProductLikeStatus,
// );

// export const updateProductViewCounter = createAsyncThunk(
//   'products/updateProductViewCounter',
//   ProductApi.updateProductViewCounter,
// );

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
        state.statuses[productId] = {
          status: reload ? 'refreshing' : 'pending',
          error: undefined,
        };
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        if (action.payload) productsAdapter.upsertOne(state, action.payload);
        state.statuses[action.meta.arg.productId] = {
          status: 'fulfilled',
          error: undefined,
        };
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.statuses[action.meta.arg.productId] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- fetchAllProducts --
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          productsAdapter.setAll(state, action.payload);
        } else {
          productsAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const productId of action.payload.map(product => product.id)) {
          state.statuses[productId] = { status: 'fulfilled' };
        }
      })
      // -- fetchProductsForVendorProfile --
      .addCase(fetchProductsForVendorProfile.fulfilled, (state, action) => {
        productsAdapter.upsertMany(state, action.payload);
        for (const productId of action.payload.map(productId => productId.id)) {
          state.statuses[productId] = { status: 'fulfilled' };
        }
      });
    // -- updateProductLikeStatus --
    // .addCase(updateProductLikeStatus.pending, (state, action) => {
    //   productsSlice.caseReducers.productLikeStatusChanged(state, {
    //     ...action,
    //     payload: action.meta.arg,
    //   });
    // })
    // .addCase(updateProductLikeStatus.rejected, (state, action) => {
    //   const oldLike = !action.meta.arg.didLike;
    //   productsSlice.caseReducers.productLikeStatusChanged(state, {
    //     ...action,
    //     payload: { ...action.meta.arg, didLike: oldLike },
    //   });
    // })
    // -- updateProductViewCounter --
    // .addCase(updateProductViewCounter.fulfilled, (state, action) => {
    //   const { productId, lastViewed = new Date().toJSON() } = action.meta.arg;
    //   const selectedProduct = state.entities[productId];
    //   if (selectedProduct) {
    //     if (selectedProduct.statistics) {
    //       selectedProduct.statistics.totalViews += 1;
    //       selectedProduct.statistics.lastViewed = lastViewed;
    //     } else {
    //       selectedProduct.statistics = {
    //         didSave: false,
    //         didLike: false,
    //         totalLikes: 0,
    //         totalViews: 1,
    //         lastViewed: lastViewed,
    //       };
    //     }
    //   }
    // });
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
  return state.products.statuses[productId] ?? { status: 'idle' };
}

export const selectProductsForMerchant = createSelector(
  [selectAllProducts, (_: RootState, id: VendorProfileId) => id],
  (products, vendorProfileId) => {
    return products.filter(product => product.vendorId === vendorProfileId);
  },
);

//#endregion Custom Product Selectors

export default productsSlice.reducer;
