import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';

import { ApiFetchStatus, AuthApi } from '../../api';
import { User } from '../../models';
import { RootState } from '../../store';

type SignInWithEmailAndPasswordParams = {
  email: string;
  password: string;
};

export const signInWithEmailAndPassword = createAsyncThunk(
  'auth/signInWithEmailAndPassword',
  async ({ email, password }: SignInWithEmailAndPasswordParams) =>
    AuthApi.signInWithEmailAndPassword(email, password),
);

export const signInWithCredential = createAsyncThunk(
  'auth/signInWithCredential',
  AuthApi.signInWithCredential,
);

type RegisterNewAccountParams = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

export const registerNewAccount = createAsyncThunk(
  'auth/registerNewAccount',
  async ({ fullName, username, email, password }: RegisterNewAccountParams) =>
    AuthApi.registerNewAccount(fullName, username, email, password),
);

type SignOutParams = {
  logoutParse?: boolean;
  logoutFirebase?: boolean;
};

export const signOut = createAsyncThunk(
  'auth/signOut',
  async ({ logoutParse = true, logoutFirebase = true }: SignOutParams) =>
    AuthApi.signOut(logoutParse, logoutFirebase),
);

export const abortSignOut = createAsyncThunk(
  'auth/abortSignOut',
  async (error: any) => {
    AuthApi.signOut().catch((error) =>
      console.warn('Failed to forcefully sign out:', error),
    );
    throw error;
  },
);

type AuthLoadingStatus =
  | 'idle'
  | 'signing-in'
  | 'registering'
  | 'signing-out'
  | 'fulfilled'
  | 'rejected';

type AuthFetchStatus = Pick<ApiFetchStatus, 'error'> & {
  status: AuthLoadingStatus;
};

export type AuthState = AuthFetchStatus & {
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  user?: User;
};

const initialState: AuthState = {
  status: 'idle',
  error: null,
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
      .addCase(PURGE, (state) => {
        // We don't want to remove the current session if the store is purged
        // console.log('Ignoring purge for authentication:', state);
        console.warn('Purging authentication... (this should be disabled)');
        Object.assign(state, initialState);
      })
      // -- signInWithEmailAndPassword --
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
      // -- signInWithCredential --
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
      // -- registerNewAccount --
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
      // -- signOut --
      .addCase(signOut.pending, (state) => {
        state.status = 'signing-out';
      })
      .addCase(signOut.fulfilled, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      });
  },
});

export const { didDismissInfoModal } = authSlice.actions;

export const selectCurrentUser = (state: RootState): User | undefined =>
  state.auth.user;

export default authSlice.reducer;
