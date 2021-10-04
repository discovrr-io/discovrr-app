import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';
import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { ApiFetchStatus, ApiFetchStatuses, MerchantApi } from 'src/api';
import { resetAppState } from 'src/globalActions';
import { Merchant, MerchantId } from 'src/models';
import { Pagination } from 'src/models/common';
import { RootState } from 'src/store';

//#region Merchant Adapter Initialization

export type MerchantsState = EntityState<Merchant> & ApiFetchStatuses;

const merchantsAdapter = createEntityAdapter<Merchant>();

const initialState = merchantsAdapter.getInitialState<ApiFetchStatuses>({
  statuses: {},
});

//#endregion Merchant Adapter Initialization

//#region Merchant Async Thunks

type FetchMerchantByIdParams = {
  merchantId: MerchantId;
  reload?: boolean;
};

export const fetchMerchantById = createAsyncThunk(
  'merchants/fetchMerchantById',
  async ({ merchantId }: FetchMerchantByIdParams) =>
    MerchantApi.fetchMerchantById(String(merchantId)),
  {
    condition: (
      { merchantId, reload = false },
      { getState }: BaseThunkAPI<RootState, unknown>,
    ) => {
      if (reload) return true;
      const { status } = selectMerchantStatusById(getState(), merchantId);
      return (
        status !== 'fulfilled' &&
        status !== 'pending' &&
        status !== 'refreshing'
      );
    },
  },
);

type FetchAllMerchantsParams = {
  pagination?: Pagination;
  reload?: boolean;
};

export const fetchAllMerchants = createAsyncThunk(
  'merchants/fetchAllMerchants',
  async ({ pagination }: FetchAllMerchantsParams = {}) =>
    MerchantApi.fetchAllMerchants(pagination),
);

type UpdateMerchantLikeStatusParams = {
  merchantId: MerchantId;
  didLike: boolean;
};

export const updateMerchantLikeStatus = createAsyncThunk(
  'merchants/updateMerchantLikeStatus',
  async ({ merchantId, didLike }: UpdateMerchantLikeStatusParams) =>
    MerchantApi.updateMerchantLikeStatus(String(merchantId), didLike),
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

//#endregion Merchant Async Thunks

//#region Merchant Slice

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
  extraReducers: builder => {
    builder
      .addCase(resetAppState, state => {
        console.log('Purging merchants...');
        Object.assign(state, initialState);
      })
      // -- fetchAllMerchants --
      .addCase(fetchAllMerchants.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        for (const merchantId of Object.keys(state.statuses)) {
          state.statuses[merchantId] = {
            status: reload ? 'refreshing' : 'pending',
          };
        }
      })
      .addCase(fetchAllMerchants.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          merchantsAdapter.setAll(state, action.payload);
        } else {
          merchantsAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const merchantId of action.payload.map(merchant => merchant.id)) {
          state.statuses[String(merchantId)] = { status: 'fulfilled' };
        }
      })
      .addCase(fetchAllMerchants.rejected, (state, action) => {
        for (const merchantId of Object.keys(state.statuses)) {
          state.statuses[merchantId] = {
            status: 'rejected',
            error: action.error,
          };
        }
      })
      // -- fetchMerchantById --
      .addCase(fetchMerchantById.pending, (state, action) => {
        const { merchantId, reload } = action.meta.arg;
        state.statuses[String(merchantId)] = {
          status: reload ? 'refreshing' : 'pending',
        };
      })
      .addCase(fetchMerchantById.fulfilled, (state, action) => {
        if (action.payload) merchantsAdapter.upsertOne(state, action.payload);
        state.statuses[String(action.meta.arg.merchantId)] = {
          status: 'fulfilled',
        };
      })
      .addCase(fetchMerchantById.rejected, (state, action) => {
        state.statuses[String(action.meta.arg.merchantId)] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- updateMerchantLikeStatus --
      .addCase(updateMerchantLikeStatus.pending, (state, action) => {
        merchantsSlice.caseReducers.merchantLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(updateMerchantLikeStatus.rejected, (state, action) => {
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

//#endregion Merchant Slice

//#region Custom Merchant Selectors

export const {
  selectAll: selectAllMerchants,
  selectById: selectMerchantById,
  selectIds: selectMerchantIds,
} = merchantsAdapter.getSelectors<RootState>(state => state.merchants);

export function selectMerchantStatusById(
  state: RootState,
  merchantId: MerchantId,
): ApiFetchStatus {
  return state.posts.statuses[String(merchantId)] ?? { status: 'idle' };
}

//#endregion Custom Merchant Selectors

export default merchantsSlice.reducer;
