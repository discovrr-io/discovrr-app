import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

import { NoteApi } from '../../api';

export const fetchNotesForCurrentUser = createAsyncThunk(
  'notes/fetchNotesForCurrentUser',
  NoteApi.fetchNotesForCurrentUser,
);

/**
 * @typedef {import('../../models').Note} Note
 * @type {import('@reduxjs/toolkit').EntityAdapter<Note>}
 */
const notesAdapter = createEntityAdapter();

/**
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Note>} CommentEntityState
 * @type {CommentEntityState & ApiFetchStatus}
 */
const initialState = notesAdapter.getInitialState({
  status: 'idle',
});

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // -- fetchNotesForCurrentUser --
    builder
      .addCase(fetchNotesForCurrentUser.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(fetchNotesForCurrentUser.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        notesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchNotesForCurrentUser.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      });
  },
});

export const {} = notesSlice.actions;

export const {
  selectAll: selectAllNotes,
  selectById: selectNoteById,
  selectIds: selectNoteIds,
} = notesAdapter.getSelectors((state) => state.notes);

export default notesSlice.reducer;
