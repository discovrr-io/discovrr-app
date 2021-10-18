import { createSlice, PayloadAction } from '@reduxjs/toolkit';

//#region Search State Initialization

const QUERY_HISTORY_CAPACITY = 5;

export type SearchState = {
  queryHistory: string[];
};

const initialState: SearchState = {
  queryHistory: [],
};

//#endregion Search State Initialization

//#region Search Slice

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearchQueryHistory: state => {
      state.queryHistory = [];
    },
    addToSearchQueryHistory: (state, action: PayloadAction<string>) => {
      // If the given query already exists in the stack, we'll remove it from
      // its existing position first.
      const existingIndex = state.queryHistory.indexOf(action.payload);
      if (existingIndex > -1) state.queryHistory.splice(existingIndex, 1);

      // Then, we'll insert the most recent query at the beginning of the stack.
      state.queryHistory.splice(0, 0, action.payload);
      // Next, we'll check if the stack has exceeded passed the capacity. Note
      // that it is should be smaller or equal to QUERY_HISTORY_CAPACITY.
      if (state.queryHistory.length > QUERY_HISTORY_CAPACITY) {
        // If the length has exceeded the capacity, we'll manually set the
        // stack's length to remove search terms that are out-of-bounds.
        state.queryHistory.length = QUERY_HISTORY_CAPACITY;
      }
    },
    removeByIndexFromSearchQueryHistory: (
      state,
      action: PayloadAction<number>,
    ) => {
      state.queryHistory.splice(action.payload, 1);
    },
  },
});

export const {
  addToSearchQueryHistory,
  clearSearchQueryHistory,
  removeByIndexFromSearchQueryHistory,
} = searchSlice.actions;

//#endregion Search Slice

export default searchSlice.reducer;
