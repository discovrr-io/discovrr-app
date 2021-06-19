import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

const Parse = require('parse/react-native');
const defaultAvatar = require('../../../resources/images/defaultAvatar.jpeg');

/**
 * @typedef {import('../../models').User} User
 * @typedef {import('../../models').FetchStatus} FetchStatus
 * @typedef {{ isAuthenticated: boolean, user?: User }} AuthState
 * @type {AuthState & FetchStatus}
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
const constructUser = (profile, firebaseUser) => {
  const avatar = profile.get('avatar');
  return {
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
      avatar: avatar ? { ...avatar, uri: avatar.url } : defaultAvatar,
      description: profile.get('description'),
      oneSignalPlayerIds: profile.get('oneSignalPlayerIds'),
    },
  };
};

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

// export const signInWithApple = createAsyncThunk(
//   'auth/signInWithEmailAndPassword',
//   /**
//    * @param {FirebaseAuthTypes.AuthCredential} credential
//    * @returns {Promise<User>}
//    */
//   async (credential) => {
//     const { user: firebaseUser } = await auth().signInWithCredential(
//       credential,
//     );
//
//     return await getUserFromParse(firebaseUser);
//   },
// );

// export const signOut = createAsyncThunk('auth/signOut', async () => {
//   await Parse.User.logOut();
//   await auth().signOut();
// });

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOut: (state, _) => {
      // Reset to initial state
      state = initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // signInWithEmailAndPassword
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
    // // signOut
    // .addCase(signOut.fulfilled, (state, _) => {
    //   // Reset to initial state
    //   state = initialState;
    // });
  },
});

export const { signOut } = authSlice.actions;

export default authSlice.reducer;
