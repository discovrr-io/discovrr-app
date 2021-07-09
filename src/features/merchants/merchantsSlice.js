import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

import { MerchantApi } from '../../api';

export const fetchAllMerchants = createAsyncThunk(
  'merchants/fetchAllMerchants',
  /**
   * @typedef {import('../../models/common').Pagination} Pagination
   * @param {{ pagination?: Pagination, reload?: boolean }=} param0
   */
  async ({ pagination } = {}) => MerchantApi.fetchAllMerchants(pagination),
);

export const fetchMerchantById = createAsyncThunk(
  'merchants/fetchMerchantById',
  MerchantApi.fetchMerchantById,
);

export const changeMerchantLikeStatus = createAsyncThunk(
  'merchants/changeMerchantLikeStatus',
  /**
   * @typedef {import('../../models').MerchantId} MerchantId
   * @param {{ merchantId: MerchantId, didLike: boolean }} param0
   */
  async ({ merchantId, didLike }) =>
    MerchantApi.changeMerchantLikeStatus(merchantId, didLike),
);
/**
 * @typedef {import('../../models').Merchant} Merchant
 * @type {import('@reduxjs/toolkit').EntityAdapter<Merchant>}
 */
const merchantsAdapter = createEntityAdapter();

/**
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Merchant>} MerchantEntityState
 * @type {MerchantEntityState & ApiFetchStatus}
 */
const initialState = merchantsAdapter.getInitialState({
  status: 'idle',
});

const merchantsSlice = createSlice({
  name: 'merchants',
  initialState,
  reducers: {
    /**
     * @typedef {{ merchantId: MerchantId, didLike: boolean }} Payload
     * @param {import('@reduxjs/toolkit').PayloadAction<Payload>} action
     */
    merchantLikeStatusChanged: (state, action) => {
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
      });
  },
});

export const {} = merchantsSlice.actions;

export const {
  selectAll: selectAllMerchants,
  selectById: selectMerchantById,
  selectIds: selectMerchantIds,
} = merchantsAdapter.getSelectors((state) => state.merchants);

export default merchantsSlice.reducer;
