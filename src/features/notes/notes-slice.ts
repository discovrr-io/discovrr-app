import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  EntityState,
} from '@reduxjs/toolkit';

import { ApiFetchStatus, NoteApi } from 'src/api';
import { resetAppState } from 'src/global-actions';
import { Note } from 'src/models';
import { RootState } from 'src/store';

//#region Note Adapter Initialization

export type NotesState = EntityState<Note> & ApiFetchStatus;

const notesAdapter = createEntityAdapter<Note>();

const initialState = notesAdapter.getInitialState<ApiFetchStatus>({
  status: 'idle',
});

//#endregion Note Adapter Initialization

//#region Note Async Thunks

export const fetchNotesForCurrentUser = createAsyncThunk(
  'notes/fetchNotesForCurrentUser',
  NoteApi.fetchNotesForCurrentUser,
);

//#endregion Note Async Thunks

//#region Note Slice

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(resetAppState, state => {
        console.log('Purging notes...');
        Object.assign(state, initialState);
      })
      // -- fetchNotesForCurrentUser --
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

//#endregion Note Slice

//#region Custom Note Selectors

export const {
  selectAll: selectAllNotes,
  selectById: selectNoteById,
  selectIds: selectNoteIds,
} = notesAdapter.getSelectors((state: RootState) => state.notes);

//#endregion Custom Note Selectors

export default notesSlice.reducer;
