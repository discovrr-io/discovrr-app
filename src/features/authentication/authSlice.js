import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { AuthApi } from '../../api';

export const signInWithEmailAndPassword = createAsyncThunk(
  'auth/signInWithEmailAndPassword',
  async ({ email, password }) =>
    AuthApi.signInWithEmailAndPassword(email, password),
);

export const signInWithCredential = createAsyncThunk(
  'auth/signInWithCredential',
  AuthApi.signInWithCredential,
);

export const registerNewAccount = createAsyncThunk(
  'auth/registerNewAccount',
  /**
   * @param {{ fullName: string, username: string, email: string, password: string }} param0
   */
  async ({ fullName, username, email, password }) =>
    AuthApi.registerNewAccount(fullName, username, email, password),
);

export const signOut = createAsyncThunk('auth/signOut', AuthApi.signOut);

/**
 * @typedef {import('../../models').User} User
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {{ isAuthenticated: boolean, user?: User }} AuthState
 * @type {AuthState & ApiFetchStatus}
 */
const initialState = {
  status: 'idle',
  isAuthenticated: false,
  user: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // signInWithEmailAndPassword
      .addCase(signInWithEmailAndPassword.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(signInWithEmailAndPassword.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(signInWithEmailAndPassword.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
      })
      // signInWithCredential
      .addCase(signInWithCredential.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(signInWithCredential.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(signInWithCredential.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
      })
      // registerNewAccount
      .addCase(registerNewAccount.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(registerNewAccount.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(registerNewAccount.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
      })
      // signOut
      .addCase(signOut.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(signOut.fulfilled, (state, action) => {
        // Reset to initial state
        state.status = 'idle';
        state.error = undefined;
        state.isAuthenticated = false;
        state.user = undefined;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      });
  },
});

export const {} = authSlice.actions;

export default authSlice.reducer;
