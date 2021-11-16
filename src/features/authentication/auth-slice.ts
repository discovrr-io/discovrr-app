import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { ApiFetchStatus, AuthApi } from 'src/api';
import { ProfileId, SessionId, User } from 'src/models';
import { RootState } from 'src/store';

//#region Authentication State Initialization

export type AuthLoadingStatus =
  | 'idle'
  | 'signing-in'
  | 'registering'
  | 'signing-out'
  | 'fulfilled'
  | 'rejected';

export type AuthFetchStatus = Pick<ApiFetchStatus, 'error'> & {
  status: AuthLoadingStatus;
};

export type AuthState = AuthFetchStatus & {
  user: User | undefined;
  sessionId: SessionId | undefined;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  didAbortSignOut: boolean;
};

const initialState: AuthState = {
  status: 'idle',
  sessionId: undefined,
  error: undefined,
  user: undefined,
  isAuthenticated: false,
  isFirstLogin: false,
  didAbortSignOut: false,
};

//#endregion Authentication State Initialization

//#region Authentication Async Thunks

export const signInWithEmailAndPassword = createAsyncThunk(
  'auth/signInWithEmailAndPassword',
  AuthApi.signInWithEmailAndPassword,
);

export const signInWithCredential = createAsyncThunk(
  'auth/signInWithCredential',
  AuthApi.signInWithCredential,
);

export const registerNewAccount = createAsyncThunk(
  'auth/registerNewAccount',
  AuthApi.registerNewAccount,
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (params: AuthApi.SignOutParams = {}) => {
    try {
      await AuthApi.signOut(params);
    } catch (error: any) {
      if (error.code === 'auth/no-current-user') {
        console.warn("User doesn't exist. Skipping sign out...");
      } else {
        // It's some other error - we'll rethrow it
        throw error;
      }
    }
  },
);

export const abortSignOut = createAsyncThunk(
  'auth/abortSignOut',
  async (error: any) => {
    AuthApi.signOut().catch(error =>
      console.warn('Failed to forcefully sign out:', error),
    );
    throw error;
  },
  {
    condition: (_, { getState }: BaseThunkAPI<RootState, unknown>) => {
      // Only run this thunk if we haven't already aborted sign out
      return !getState().auth.didAbortSignOut;
    },
  },
);

//#endregion Authentication Async Thunks

//#region Authentication Slice

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // TODO: Remove this
    dismissInfoModal: state => {
      state.isFirstLogin = false;
    },
    dismissAbortSignOutAlert: state => {
      state.didAbortSignOut = false;
    },
  },
  extraReducers: builder => {
    builder
      // -- signInWithEmailAndPassword --
      .addCase(signInWithEmailAndPassword.pending, state => {
        state.status = 'signing-in';
      })
      .addCase(signInWithEmailAndPassword.fulfilled, (state, action) => {
        const [user, sessionId] = action.payload;
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = user;
        state.sessionId = sessionId;
        state.isFirstLogin = true;
      })
      .addCase(signInWithEmailAndPassword.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
        state.isFirstLogin = false;
      })
      // -- signInWithCredential --
      .addCase(signInWithCredential.pending, state => {
        state.status = 'signing-in';
      })
      .addCase(signInWithCredential.fulfilled, (state, action) => {
        const [user, sessionId] = action.payload;
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = user;
        state.sessionId = sessionId;
        state.isFirstLogin = true;
      })
      .addCase(signInWithCredential.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
        state.isFirstLogin = false;
      })
      // -- registerNewAccount --
      .addCase(registerNewAccount.pending, state => {
        state.status = 'registering';
      })
      .addCase(registerNewAccount.fulfilled, (state, action) => {
        const [user, sessionId] = action.payload;
        state.status = 'fulfilled';
        state.isAuthenticated = true;
        state.user = user;
        state.sessionId = sessionId;
        state.isFirstLogin = true;
      })
      .addCase(registerNewAccount.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        state.user = undefined;
        state.isFirstLogin = false;
      })
      // -- signOut --
      .addCase(signOut.pending, state => {
        state.status = 'signing-out';
      })
      .addCase(signOut.fulfilled, state => {
        Object.assign(state, initialState);
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // --- abortSignOut
      .addCase(abortSignOut.rejected, (state, action) => {
        Object.assign(state, {
          ...initialState,
          status: 'rejected',
          error: action.error,
          didAbortSignOut: true,
        });
      });
  },
});

export const { dismissInfoModal, dismissAbortSignOutAlert } = authSlice.actions;

//#endregion Authentication Slice

//#region Custom Authentication Selectors

export const selectCurrentAuthState = (state: RootState) =>
  [state.auth.status, state.auth.error] as const;

export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectCurrentUserProfileId = (state: RootState) =>
  state.auth.user?.profileId;

export const selectIsCurrentUserProfile = (
  state: RootState,
  profileId: ProfileId,
) => profileId === selectCurrentUserProfileId(state);

//#endregion Custom Authentication Selectors

export default authSlice.reducer;
