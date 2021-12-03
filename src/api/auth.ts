import { Image } from 'react-native';

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import analytics from '@react-native-firebase/analytics';
import messaging from '@react-native-firebase/messaging';

import Parse from 'parse/react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import * as constants from 'src/constants';
import { SessionId, User, UserId } from 'src/models';
import { ProfileId, ProfileKind } from 'src/models/profile';

import {
  ApiError,
  ApiObjectStatus,
  CommonApiErrorCode,
  MediaSource,
} from './common';

export namespace AuthApi {
  export type AuthApiErrorCode =
    | CommonApiErrorCode
    | 'USERNAME_TAKEN'
    | 'NO_PROFILE_FOUND';
  export class AuthApiError extends ApiError<AuthApiErrorCode> {}
  export type AuthenticatedResult = readonly [User, SessionId];

  const $PREFIX = 'AuthApi';

  type ImageSize = { width: number; height: number };

  function getImageSize(uri: string): Promise<ImageSize> {
    return new Promise<ImageSize>((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        error => reject(error),
      );
    });
  }

  async function syncAndConstructUser(
    currentUserId: string,
    profile: Parse.Object,
    firebaseUser: FirebaseAuthTypes.User,
  ): Promise<User> {
    const $FUNC = `[${$PREFIX}.syncAndConstructUser]`;
    let syncProfile = false;

    const provider: string | undefined = profile.get('provider');
    const firebaseProviderId = firebaseUser.providerData[0]?.providerId;
    if (!provider && firebaseProviderId) {
      profile.set('provider', firebaseProviderId);
      syncProfile = true;
    }

    const displayName: string | undefined = profile.get('displayName');
    if ((!displayName || displayName === '---') && firebaseUser.displayName) {
      profile.set('displayName', firebaseUser.displayName);
      syncProfile = true;
    } else if (displayName) {
      console.log($FUNC, 'Updating Firebase display name...');
      await firebaseUser.updateProfile({ displayName });
    } else {
      const username: string = profile.get('username');
      profile.set('displayName', username);
      console.log($FUNC, 'Setting Firebase display name to username...');
      await firebaseUser.updateProfile({ displayName: username });
    }

    // const avatar: MediaSource | undefined = profile.get('avatar');
    // if (!avatar && firebaseUser.photoURL) {
    //   profile.set('avatar', {
    //     url: firebaseUser.photoURL,
    //     ...DEFAULT_AVATAR_DIMENSIONS,
    //   });
    //   syncProfile = true;
    // }

    // We want to update the avatar every time we log in
    if (firebaseUser.photoURL) {
      let avatar: MediaSource;

      if (firebaseProviderId.includes('google')) {
        console.log($FUNC, 'Updating avatar...');

        // Replace the URL to the avatar with one of a higher resolution
        const photoURL = firebaseUser.photoURL.replace('s96-c', 's300-c');
        avatar = {
          mime: 'image/jpeg',
          type: 'image/jpeg',
          url: photoURL,
          width: 300,
          height: 300,
        };

        await firebaseUser.updateProfile({ photoURL });
      } else {
        let imageSize: ImageSize;

        try {
          imageSize = await getImageSize(firebaseUser.photoURL);
        } catch (error) {
          console.warn($FUNC, 'Failed to get image size of photo URL:', error);
          imageSize = constants.media.DEFAULT_AVATAR_DIMENSIONS;
        }

        avatar = {
          mime: 'image/jpeg',
          type: 'image/jpeg',
          url: firebaseUser.photoURL,
          ...imageSize,
        };
      }

      profile.set('avatar', avatar);
      syncProfile = true;
    }

    const email: string | undefined = profile.get('email');
    if (!email && firebaseUser.email) {
      profile.set('email', firebaseUser.email);
      syncProfile = true;
    }

    const phone: string | undefined = profile.get('phone');
    if (!phone && firebaseUser.phoneNumber) {
      profile.set('phone', firebaseUser.phoneNumber);
      syncProfile = true;
    }

    if (syncProfile) {
      try {
        console.log($FUNC, 'Syncing profile...');
        await profile.save();
      } catch (error) {
        // We'll continue the authentication process regardless of the
        // synchronisation outcome
        console.error($FUNC, 'Failed to synchronise profile:', error);
      }
    }

    return {
      id: currentUserId,
      provider: firebaseProviderId,
      profileId: profile.id,
    } as User;
  }

  async function attemptToFetchProfileForUser(
    currentUser: Parse.User,
  ): Promise<Parse.Object | undefined> {
    const $FUNC = `[${$PREFIX}.attemptToFetchProfileForUser]`;
    const MAX_ATTEMPTS = 3;

    console.log($FUNC, 'Querying profile...');
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    query.notEqualTo('status', ApiObjectStatus.DELETED);
    query.equalTo('user', currentUser.toPointer());

    let profile = await query.first();
    console.log($FUNC, 'Found Parse profile:', profile?.id);

    let attempts = 0;
    while (!profile && attempts < MAX_ATTEMPTS) {
      console.warn($FUNC, `Current user profile ID not found.`);
      console.log($FUNC, `(Attempt ${attempts + 1} of ${MAX_ATTEMPTS})`);
      await new Promise<void>(resolve => {
        setTimeout(async () => {
          const result = await query.first();
          profile = result;
          attempts += 1;
          resolve();
        }, 2000);
      });
    }

    return profile;
  }

  async function authenticateViaParse(
    firebaseUser: FirebaseAuthTypes.User,
  ): Promise<User> {
    const $FUNC = `[${$PREFIX}.authenticateViaParse]`;

    const authData = {
      access_token: await firebaseUser.getIdToken(),
      id: firebaseUser.uid,
    };

    let currentUser = await Parse.User.currentAsync();
    if (!currentUser) {
      console.log($FUNC, 'Current user not found. Logging in with Firebase...');
      currentUser = await Parse.User.logInWith('firebase', { authData });
      console.log(
        $FUNC,
        'Successfully logged in with Firebase via Parse:',
        currentUser.id,
      );
    }

    const profile = await attemptToFetchProfileForUser(currentUser);
    if (!profile) {
      console.error(
        $FUNC,
        'No profile was found with user ID:',
        currentUser.id,
      );

      throw new AuthApiError(
        'NO_PROFILE_FOUND',
        'No profile was found with the given user ID.',
      );
    }

    return await syncAndConstructUser(currentUser.id, profile, firebaseUser);
  }

  //#region SIGN IN WITH EMAIL AND PASSWORD

  export type SignInWithEmailAndPasswordParams = {
    email: string;
    password: string;
  };

  export async function signInWithEmailAndPassword(
    params: SignInWithEmailAndPasswordParams,
  ): Promise<AuthenticatedResult> {
    const $FUNC = `[${$PREFIX}.signInWithEmailAndPassword]`;
    const { email, password } = params;

    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      console.log($FUNC, 'Authenticating via Firebase...');
      const { user: firebaseUser, additionalUserInfo } =
        await auth().signInWithEmailAndPassword(email, password);
      didLoginViaFirebase = true;

      if (additionalUserInfo?.isNewUser) {
        console.warn(
          $FUNC,
          'A new user has bypassed registration and is attempting to sign in',
          "with a new email and password, which is unexpected. From now we'll",
          'assume this user is new.',
        );
      }

      console.log($FUNC, 'Authenticating via Parse...');
      const authenticatedUser = await authenticateViaParse(firebaseUser);
      const currentSession = await Parse.Session.current();
      didLoginViaParse = true;

      return [authenticatedUser, currentSession.id as SessionId];
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut({
        logoutParse: didLoginViaParse,
        logoutFirebase: didLoginViaFirebase,
      });

      console.error($FUNC, 'Failed to sign in with credential:', error);
      throw error;
    }
  }

  //#endregion SIGN IN WITH EMAIL AND PASSWORD

  //#region SIGN IN WITH CREDENTIAL

  export type SignInWithCredentialParams = {
    credential: FirebaseAuthTypes.AuthCredential;
  };

  export async function signInWithCredential(
    params: SignInWithCredentialParams,
  ): Promise<AuthenticatedResult> {
    const $FUNC = `[${$PREFIX}.signInWithCredential]`;
    const { credential } = params;

    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      console.log($FUNC, 'Authenticating via Firebase...');
      const { user } = await auth().signInWithCredential(credential);
      didLoginViaFirebase = true;

      console.log($FUNC, 'Authenticating via Parse...');
      const authenticatedUser = await authenticateViaParse(user);
      const currentSession = await Parse.Session.current();
      didLoginViaParse = true;

      return [authenticatedUser, currentSession.id as SessionId];
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut({
        logoutParse: didLoginViaParse,
        logoutFirebase: didLoginViaFirebase,
      });

      console.error($FUNC, 'Failed to sign in with credential:', error);
      throw error;
    }
  }

  //#endregion SIGN IN WITH CREDENTIAL

  //#region REGISTER

  /**
   * Determines if the given username is available for use.
   *
   * NOTE: This will return `false` if the current user is checking the
   * availability of their own username. This is intended behaviour as their
   * own username is, of course, not available to anyone.
   *
   * @param username The username to check if available.
   * @returns Whether or not the given username is available.
   */
  export async function checkIfUsernameAvailable(
    username: string,
  ): Promise<boolean> {
    // We're calling a cloud function here because the server can run the query
    // using the master key.
    return Parse.Cloud.run('checkIfUsernameAvailable', { username });
  }

  export type RegisterNewAccountParams = {
    kind: ProfileKind;
    displayName: string;
    username: string;
    email: string;
    password: string;
  };

  export async function registerNewAccount(
    params: RegisterNewAccountParams,
  ): Promise<AuthenticatedResult> {
    const $FUNC = `[${$PREFIX}.registerNewAccount]`;
    const { kind, displayName, username, email, password } = params;

    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      if (!(await checkIfUsernameAvailable(username))) {
        throw new AuthApiError(
          'USERNAME_TAKEN',
          'The provided username is already taken.',
        );
      }

      console.log($FUNC, 'Creating new user via Firebase...');
      const { user: firebaseUser } =
        await auth().createUserWithEmailAndPassword(email, password);
      didLoginViaFirebase = true;

      console.log($FUNC, 'Updating Firebase profile');
      await firebaseUser.updateProfile({ displayName });

      const authData = {
        access_token: await firebaseUser.getIdToken(),
        id: firebaseUser.uid,
      };

      console.log($FUNC, 'Authenticating user via Parse...');
      const parseUser = await Parse.User.logInWith('firebase', { authData });
      console.log($FUNC, 'Successfully logged in via Parse:', parseUser.id);
      didLoginViaParse = true;

      const provider: string | undefined =
        firebaseUser.providerData[0]?.providerId;

      // We'll update the profile here as the server will automatically generate
      // a profile for us when signing up (or logging in for the first time via
      // Google or Apple).
      console.log($FUNC, `Updating new profile...`);
      const updatedProfile: Parse.Object = await Parse.Cloud.run(
        'updateProfileForCurrentUser',
        {
          changes: {
            kind,
            email: email.trim(),
            displayName: displayName.trim(),
            username: username.trim(),
            provider,
          },
        },
      );

      const user: User = {
        provider,
        id: parseUser.id as UserId,
        profileId: updatedProfile.id as ProfileId,
      };

      const currentSession = await Parse.Session.current();

      return [user, currentSession.id as SessionId] as const;
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut({
        logoutParse: didLoginViaParse,
        logoutFirebase: didLoginViaFirebase,
      });

      console.error($FUNC, 'Failed to register account:', error);
      throw error;
    }
  }

  //#endregion REGISTER

  //#region SIGN OUT

  export type SignOutParams = {
    logoutParse?: boolean;
    logoutFirebase?: boolean;
  };

  export async function signOut(params: SignOutParams = {}) {
    const $FUNC = `[${$PREFIX}.signOut]`;
    const { logoutParse = true, logoutFirebase = true } = params;

    if (logoutParse) {
      console.log($FUNC, 'Signing out of Parse...');
      await Parse.User.logOut();
    }

    if (logoutFirebase) {
      console.log($FUNC, 'Signing out of Firebase...');
      await auth().signOut();
      await analytics().setUserId(null);
    }

    if (await GoogleSignin.isSignedIn()) {
      console.log($FUNC, 'Signing out of Google...');
      await GoogleSignin.signOut();
    }

    await messaging()
      .deleteToken()
      .catch(error => console.warn('Failed to delete FCM token:', error));
  }

  //#endregion SIGN OUT
}
