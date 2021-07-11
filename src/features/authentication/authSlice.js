import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

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
   * @typedef {{fullName: string;username: string;email: string;password: string;}} RegisterFormDetails
   * @param {RegisterFormDetails} param0
   */
  async ({ fullName, username, email, password }) =>
    AuthApi.registerNewAccount(fullName, username, email, password),
);

export const signOut = createAsyncThunk('auth/signOut', AuthApi.signOut);

/**
 * @typedef {import('../../models').User} User
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 *
 * @typedef {'idle' | 'signing-in' | 'registering' | 'signing-out' | 'fulfilled' | 'rejected'} AuthLoadingStatus
 * @typedef {Pick<ApiFetchStatus, 'error'> & { status: AuthLoadingStatus }} CurrentAuthStatus
 *
 * @typedef {{ isAuthenticated: boolean, isFirstLogin?: boolean, user?: User }} AuthState
 * @type {AuthState & CurrentAuthStatus}
 */
const initialState = {
  status: 'idle',
  isAuthenticated: false,
  isFirstLogin: false,
  user: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    didDismissInfoModal: (state) => {
      state.isFirstLogin = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // signInWithEmailAndPassword
      .addCase(signInWithEmailAndPassword.pending, (state) => {
        state.status = 'signing-in';
      })
      .addCase(signInWithEmailAndPassword.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isFirstLogin = true;
      })
      .addCase(signInWithEmailAndPassword.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
        state.isFirstLogin = false;
      })
      // signInWithCredential
      .addCase(signInWithCredential.pending, (state) => {
        state.status = 'signing-in';
      })
      .addCase(signInWithCredential.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isFirstLogin = true;
      })
      .addCase(signInWithCredential.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
        state.isFirstLogin = false;
      })
      // registerNewAccount
      .addCase(registerNewAccount.pending, (state) => {
        state.status = 'registering';
      })
      .addCase(registerNewAccount.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isFirstLogin = true;
      })
      .addCase(registerNewAccount.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
        state.isFirstLogin = false;
      })
      // signOut
      .addCase(signOut.pending, (state) => {
        state.status = 'signing-out';
        state.isSigningOut = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.isSigningOut = false;
        state.isFirstLogin = false;
      });
  },
});

export const { didDismissInfoModal } = authSlice.actions;

/** @type {(state: any) => User | undefined} */
export const selectCurrentUser = (state) => state.auth.user;

export default authSlice.reducer;
