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
   * @typedef {{ fullName: string, username: string, email: string, password: string }} RegisterFormDetails
   * @param {RegisterFormDetails} param0
   */
  async ({ fullName, username, email, password }) =>
    AuthApi.registerNewAccount(fullName, username, email, password),
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  /**
   * @param {{ logoutParse?: boolean, logoutFirebase?: boolean }=} param0
   */
  async ({ logoutParse = true, logoutFirebase = true } = {}) =>
    AuthApi.signOut(logoutParse, logoutFirebase),
);

export const abortSignOut = createAsyncThunk(
  'auth/abortSignOut',
  /**
   * @param {any} error The error object to throw.
   */
  async (error) => {
    AuthApi.signOut().catch((error) =>
      console.warn('Failed to forcefully sign out:', error),
    );
    throw error;
  },
);

/**
 * @typedef {import('../../models').User} User
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 *
 * @typedef {'idle' | 'signing-in' | 'registering' | 'signing-out' | 'fulfilled' | 'rejected'} AuthLoadingStatus
 * @typedef {Pick<ApiFetchStatus, 'error'> & { status: AuthLoadingStatus }} CurrentAuthStatus
 *
 * @typedef {{ isAuthenticated: boolean, isFirstLogin?: boolean, user?: User }} BaseAuthState
 * @typedef {BaseAuthState & CurrentAuthStatus} AuthState
 * @type {AuthState}
 */
const initialState = {
  status: 'idle',
  error: undefined,
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
    /**
     * @typedef {import('@reduxjs/toolkit').PayloadAction<User>} PayloadAction
     * @param {PayloadAction} action
     */
    updateUser: (state, action) => {
      state.user = action.payload;
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
        state.error = undefined;
        state.isAuthenticated = true;
        state.isFirstLogin = true;
        state.user = action.payload;
      })
      .addCase(signInWithEmailAndPassword.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.isFirstLogin = false;
        state.user = undefined;
      })
      // signInWithCredential
      .addCase(signInWithCredential.pending, (state) => {
        state.status = 'signing-in';
      })
      .addCase(signInWithCredential.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = undefined;
        state.isAuthenticated = true;
        state.isFirstLogin = true;
        state.user = action.payload;
      })
      .addCase(signInWithCredential.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.isFirstLogin = false;
        state.user = undefined;
      })
      // registerNewAccount
      .addCase(registerNewAccount.pending, (state) => {
        state.status = 'registering';
      })
      .addCase(registerNewAccount.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = undefined;
        state.isAuthenticated = true;
        state.isFirstLogin = true;
        state.user = action.payload;
      })
      .addCase(registerNewAccount.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.isFirstLogin = false;
        state.user = undefined;
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
      })
      // abortSignOut
      .addCase(abortSignOut.rejected, (state, action) => {
        Object.assign(state, initialState);
        state.status = 'fulfilled';
        const error = action.meta.arg;
        // We're not guaranteed that error is iterable or has `name`, `code` or
        // `message` fields, so we manually assign these fields even if they're
        // undefined.
        state.error = {
          name: error.name,
          code: error.code,
          message: error.message ?? String(error),
        };
      });
  },
});

export const { didDismissInfoModal } = authSlice.actions;

/** @type {(state: any) => User | undefined} */
export const selectCurrentUser = (state) => state.auth.user;

export default authSlice.reducer;
