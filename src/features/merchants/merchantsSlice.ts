import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { PURGE } from 'redux-persist';

import { ApiFetchStatus, MerchantApi } from '../../api';
import { Merchant, MerchantId } from '../../models';
import { Pagination } from '../../models/common';
import { RootState } from '../../store';
import { selectProductsForMerchant } from '../products/productsSlice';

type FetchAllMerchantsParams = {
  pagination?: Pagination;
  reload?: boolean;
};

export const fetchAllMerchants = createAsyncThunk(
  'merchants/fetchAllMerchants',
  async ({ pagination }: FetchAllMerchantsParams = {}) =>
    MerchantApi.fetchAllMerchants(pagination),
);

export const fetchMerchantById = createAsyncThunk(
  'merchants/fetchMerchantById',
  async (merchantId: MerchantId) =>
    MerchantApi.fetchMerchantById(String(merchantId)),
);

type ChangeMerchantLikeStatusParams = {
  merchantId: MerchantId;
  didLike: boolean;
};

export const changeMerchantLikeStatus = createAsyncThunk(
  'merchants/changeMerchantLikeStatus',
  async ({ merchantId, didLike }: ChangeMerchantLikeStatusParams) =>
    MerchantApi.changeMerchantLikeStatus(String(merchantId), didLike),
);

type UpdateMerchantViewCountParams = {
  merchantId: MerchantId;
  lastViewed?: string;
};

export const updateMerchantViewCounter = createAsyncThunk(
  'products/updateMerchantViewCounter',
  async ({ merchantId }: UpdateMerchantViewCountParams) =>
    MerchantApi.updateMerchantViewCounter(String(merchantId)),
);

export type MerchantsState = EntityState<Merchant> & ApiFetchStatus;

const merchantsAdapter = createEntityAdapter<Merchant>();

const initialState = merchantsAdapter.getInitialState<ApiFetchStatus>({
  status: 'idle',
});

const merchantsSlice = createSlice({
  name: 'merchants',
  initialState,
  reducers: {
    merchantLikeStatusChanged: (
      state,
      action: PayloadAction<{ merchantId: MerchantId; didLike: boolean }>,
    ) => {
      const { merchantId, didLike } = action.payload;
      const existingMerchant = state.entities[merchantId];
      if (existingMerchant && existingMerchant.statistics) {
        existingMerchant.statistics.didLike = didLike;
        existingMerchant.statistics.totalLikes += didLike ? 1 : -1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(PURGE, (state) => {
        console.log('Purging merchants...');
        Object.assign(state, initialState);
      })
      // -- fetchAllMerchants --
      .addCase(fetchAllMerchants.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        state.status = reload ? 'refreshing' : 'pending';
      })
      .addCase(fetchAllMerchants.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        const { reload = false } = action.meta.arg ?? {};
        if (reload) {
          merchantsAdapter.setAll(state, action.payload);
        } else {
          merchantsAdapter.upsertMany(state, action.payload);
        }
      })
      .addCase(fetchAllMerchants.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- fetchMerchantById --
      .addCase(fetchMerchantById.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchMerchantById.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        merchantsAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchMerchantById.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- changeMerchantLikeStatus --
      .addCase(changeMerchantLikeStatus.pending, (state, action) => {
        state.status = 'pending';
        merchantsSlice.caseReducers.merchantLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(changeMerchantLikeStatus.rejected, (state, action) => {
        state.status = 'rejected';
        const oldLike = !action.meta.arg.didLike;
        merchantsSlice.caseReducers.merchantLikeStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didLike: oldLike },
        });
      })
      // -- updateMerchantViewCounter --
      .addCase(updateMerchantViewCounter.fulfilled, (state, action) => {
        const { merchantId, lastViewed = new Date().toJSON() } =
          action.meta.arg;
        const selectedMerchant = state.entities[merchantId];
        if (selectedMerchant) {
          if (selectedMerchant.statistics) {
            selectedMerchant.statistics.totalViews += 1;
            selectedMerchant.statistics.lastViewed = lastViewed;
          } else {
            selectedMerchant.statistics = {
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

export const {} = merchantsSlice.actions;

export const {
  selectAll: selectAllMerchants,
  selectById: selectMerchantById,
  selectIds: selectMerchantIds,
} = merchantsAdapter.getSelectors<RootState>((state) => state.merchants);

export const selectTotalLikesForMerchant = createSelector(
  [selectProductsForMerchant, selectMerchantById],
  (products, merchant) => {
    const merchantLikes = merchant.statistics?.totalLikes ?? 0;
    const productLikes = products.reduce(
      (acc, curr) => acc + curr.statistics?.totalLikes ?? 0,
      0,
    );

    return merchantLikes + productLikes;
  },
);

export default merchantsSlice.reducer;
