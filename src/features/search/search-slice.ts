import { createSlice, PayloadAction } from '@reduxjs/toolkit';

//#region Search State Initialization

const MAX_QUERY_HISTORY = 5;

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
      // console.log('OLD STATE', state.queryHistory);
      // // TODO: Move item if it already exists in the queue
      // if (state.queryHistory.length >= MAX_QUERY_HISTORY) {
      //   console.log('SLICING...');
      //   state.queryHistory = [
      //     action.payload,
      //     ...state.queryHistory.slice(0, MAX_QUERY_HISTORY - 1),
      //   ];
      // } else {
      //   state.queryHistory.unshift(action.payload);
      // }
      // console.log('NEW STATE', state.queryHistory);
    },
  },
});

export const { addToSearchQueryHistory, clearSearchQueryHistory } =
  searchSlice.actions;

//#endregion Search Slice

export default searchSlice.reducer;
