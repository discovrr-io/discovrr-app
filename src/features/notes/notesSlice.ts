import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  EntityState,
} from '@reduxjs/toolkit';

import { PURGE } from 'redux-persist';

import { ApiFetchStatus, NoteApi } from '../../api';
import { Note } from '../../models';
import { RootState } from '../../store';

export const fetchNotesForCurrentUser = createAsyncThunk(
  'notes/fetchNotesForCurrentUser',
  NoteApi.fetchNotesForCurrentUser,
);

export type NotesState = EntityState<Note> & ApiFetchStatus;

const notesAdapter = createEntityAdapter<Note>();

const initialState = notesAdapter.getInitialState<ApiFetchStatus>({
  status: 'idle',
});

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(PURGE, (state) => {
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

export const {
  selectAll: selectAllNotes,
  selectById: selectNoteById,
  selectIds: selectNoteIds,
} = notesAdapter.getSelectors((state: RootState) => state.notes);

export default notesSlice.reducer;
