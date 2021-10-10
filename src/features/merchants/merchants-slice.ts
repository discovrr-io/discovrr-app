import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  EntityState,
} from '@reduxjs/toolkit';
import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { resetAppState } from 'src/global-actions';
import { Merchant, MerchantId } from 'src/models';
import { RootState } from 'src/store';

import {
  ApiFetchStatus,
  ApiFetchStatuses,
  MerchantApi,
  Reloadable,
} from 'src/api';

//#region Merchant Adapter Initialization

type MerchantApiFetchStatuses = ApiFetchStatuses<MerchantId>;
export type MerchantsState = EntityState<Merchant> & MerchantApiFetchStatuses;

const merchantsAdapter = createEntityAdapter<Merchant>();

const initialState = merchantsAdapter.getInitialState<MerchantApiFetchStatuses>(
  {
    statuses: {},
  },
);

//#endregion Merchant Adapter Initialization

//#region Merchant Async Thunks

export const fetchMerchantById = createAsyncThunk<
  Merchant,
  Reloadable<MerchantApi.FetchMerchantByIdParams>
>('merchants/fetchMerchantById', MerchantApi.fetchMerchantById, {
  condition: (
    { merchantId, reload = false },
    { getState }: BaseThunkAPI<RootState, unknown>,
  ) => {
    if (reload) return true;
    const { status } = selectMerchantStatusById(getState(), merchantId);
    return (
      status !== 'fulfilled' && status !== 'pending' && status !== 'refreshing'
    );
  },
});

export const fetchAllMerchants = createAsyncThunk<
  Merchant[],
  Reloadable<MerchantApi.FetchAllMerchantsParams>
>('merchants/fetchAllMerchants', MerchantApi.fetchAllMerchants);

//#endregion Merchant Async Thunks

//#region Merchant Slice

const merchantsSlice = createSlice({
  name: 'merchants',
  initialState,
  reducers: {
    // merchantLikeStatusChanged: (
    //   state,
    //   action: PayloadAction<{ merchantId: MerchantId; didLike: boolean }>,
    // ) => {
    //   const { merchantId, didLike } = action.payload;
    //   const existingMerchant = state.entities[merchantId];
    //   if (existingMerchant && existingMerchant.statistics) {
    //     existingMerchant.statistics.didLike = didLike;
    //     existingMerchant.statistics.totalLikes += didLike ? 1 : -1;
    //   }
    // },
  },
  extraReducers: builder => {
    builder
      .addCase(resetAppState, state => {
        console.log('Purging merchants...');
        Object.assign(state, initialState);
      })
      // -- fetchAllMerchants --
      .addCase(fetchAllMerchants.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          merchantsAdapter.setAll(state, action.payload);
        } else {
          merchantsAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const merchantId of action.payload.map(merchant => merchant.id)) {
          state.statuses[merchantId] = { status: 'fulfilled' };
        }
      })
      // -- fetchMerchantById --
      .addCase(fetchMerchantById.pending, (state, action) => {
        const { merchantId, reload } = action.meta.arg;
        state.statuses[merchantId] = {
          status: reload ? 'refreshing' : 'pending',
        };
      })
      .addCase(fetchMerchantById.fulfilled, (state, action) => {
        if (action.payload) merchantsAdapter.upsertOne(state, action.payload);
        state.statuses[action.meta.arg.merchantId] = {
          status: 'fulfilled',
        };
      })
      .addCase(fetchMerchantById.rejected, (state, action) => {
        state.statuses[action.meta.arg.merchantId] = {
          status: 'rejected',
          error: action.error,
        };
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
  return state.merchants.statuses[merchantId] ?? { status: 'idle' };
}

//#endregion Custom Merchant Selectors

export default merchantsSlice.reducer;
