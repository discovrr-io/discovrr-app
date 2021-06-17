import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

const Parse = require('parse/react-native');

/**
 * @typedef {import('../../constants/api').FetchStatus} FetchStatus
 *
 * @typedef {import('@reduxjs/toolkit').EntityId} ProfileId
 * @typedef {{ type: string, url: string, with: number, height: number }} ProfileAvatar
 * @typedef {{ id: ProfileId, userId: string, fullName: string, username: string, email: string, phone?: string, avatar?: ProfileAvatar, description?: string }} Profile
 * @typedef {{ locationRadius?: number }} UserSettings
 * @typedef {{ provider: string, profile: Profile, settings?: UserSettings }} User
 *
 * @typedef {FetchStatus & { isAuthenticated: boolean; user?: User }} AuthState
 * @type {AuthState}
 */
const initialState = {
  status: 'idle',
  isAuthenticated: false,
};

/**
 * @param {Parse.Object<Parse.Attributes>} profile
 * @param {FirebaseAuthTypes.User} firebaseUser
 * @returns {User}
 */
const constructUser = (profile, firebaseUser) => ({
  provider: firebaseUser.providerId,
  profile: {
    id: profile.id,
    userId: profile.get('owner').id,
    fullName:
      profile.get('fullName') ??
      profile.get('name') ??
      profile.get('displayName') ??
      firebaseUser.displayName,
    username: profile.get('username'),
    email: profile.get('email') ?? firebaseUser.email,
    phone: profile.get('phone'),
    avatar: profile.get('avatar'),
    description: profile.get('description'),
  },
});

/**
 * @param {Parse.Object<Parse.Attributes>} profile
 * @param {FirebaseAuthTypes.User} firebaseUser
 */
async function syncProfile(profile, firebaseUser) {
  let syncProfile = false;

  let fullName =
    profile.get('fullName') ||
    profile.get('name') ||
    profile.get('displayName');
  if (!fullName && firebaseUser.displayName) {
    profile.set('fullName', firebaseUser.displayName ?? '');
    syncProfile = true;
  } else if (fullName /* && !firebaseUser.displayName */) {
    console.log('[LoginScreen] Updating Firebase display name...');
    await firebaseUser.updateProfile({ displayName: fullName });
  }

  let phone = profile.get('phone');
  if (!phone && firebaseUser.phoneNumber) {
    profile.set('phone', firebaseUser.phoneNumber);
    syncProfile = true;
  }

  // May be undefined if anonymous
  let email = profile.get('email');
  if (!email && firebaseUser.email) {
    profile.set('email', firebaseUser.email);
    syncProfile = true;
  }

  let avatar = profile.get('avatar');
  if (!avatar && firebaseUser.photoURL) {
    avatar = {
      mime: 'image/jpeg',
      type: 'image',
      url: firebaseUser.photoURL,
    };

    profile.set('avatar', avatar);
    syncProfile = true;
  }

  if (syncProfile) await profile.save();
}

/**
 * @param {FirebaseAuthTypes.User} firebaseUser
 * @returns {Promise<User>}
 */
export const getUserFromParse = async (firebaseUser) => {
  let currentUser = await Parse.User.currentAsync();

  if (currentUser) {
    console.log('User found in async storage');
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    query.equalTo('owner', currentUser);

    const profile = await query.first();
    console.log('Found Parse profile', profile.id);

    if (profile && profile.id) {
      return constructUser(profile, firebaseUser);
    } else {
      throw new Error(`No profile with owner: ${currentUser.id}`);
    }
  }

  const authData = {
    access_token: await firebaseUser.getIdToken(),
    id: firebaseUser.uid,
  };

  currentUser = await Parse.User.logInWith('firebase', { authData });
  console.log('Successfully logged in with Firebase:', currentUser.id);

  const query = new Parse.Query(Parse.Object.extend('Profile'));
  query.equalTo('owner', currentUser);

  const profile = await query.first();
  console.log('Found Parse profile', profile.id);

  await syncProfile(profile, firebaseUser);
  return constructUser(profile, firebaseUser);
};

export const signInWithEmailAndPassword = createAsyncThunk(
  'auth/signInWithEmailAndPassword',
  /**
   * @param {{ email: string, password: string }} loginValues
   * @returns {Promise<User>}
   */
  async (loginValues) => {
    const { user: firebaseUser } = await auth().signInWithEmailAndPassword(
      loginValues.email,
      loginValues.password,
    );

    return await getUserFromParse(firebaseUser);
  },
);

export const signInWithApple = createAsyncThunk(
  'auth/signInWithEmailAndPassword',
  /**
   * @param {FirebaseAuthTypes.AuthCredential} credential
   * @returns {Promise<User>}
   */
  async (credential) => {
    const { user: firebaseUser } = await auth().signInWithCredential(
      credential,
    );

    return await getUserFromParse(firebaseUser);
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signInWithEmailAndPassword.pending, (state, _) => {
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
      });
  },
});

export const {} = authSlice.actions;

export default authSlice.reducer;
