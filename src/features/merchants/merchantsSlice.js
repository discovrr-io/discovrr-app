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
   * @param {{ pagination: Pagination, reload?: boolean }} param0
   */
  async ({ pagination }) => MerchantApi.fetchAllMerchants(pagination),
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      // -- fetchAllMerchants --
      .addCase(fetchAllMerchants.pending, (state, action) => {
        const { reload } = action.meta.arg;
        state.status = reload ? 'refreshing' : 'pending';
      })
      .addCase(fetchAllMerchants.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        merchantsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchAllMerchants.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
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
