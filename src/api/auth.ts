import Parse from 'parse/react-native';
import analytics from '@react-native-firebase/analytics';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import { MediaSource } from './common';
import { ProfileId, SessionId, User, UserId } from 'src/models';
import { DEFAULT_AVATAR_DIMENSIONS } from 'src/constants/media';
import { ApiError, CommonApiErrorCode } from '.';

export namespace AuthApi {
  export type AuthApiErrorCode =
    | CommonApiErrorCode
    | 'USERNAME_TAKEN'
    | 'NO_PROFILE_FOUND';
  export class AuthApiError extends ApiError<AuthApiErrorCode> {}

  export type AuthenticatedResult = readonly [User, SessionId];

  async function syncAndConstructUser(
    currentUserId: string,
    profile: Parse.Object,
    firebaseUser: FirebaseAuthTypes.User,
  ): Promise<User> {
    const $FUNC = '[AuthApi.syncAndConstructUser]';
    let syncProfile = false;

    const displayName: string | undefined =
      profile.get('fullName') ||
      profile.get('displayName') ||
      profile.get('name');
    if (!displayName && firebaseUser.displayName) {
      // profile.set('fullName', firebaseUser.displayName);
      profile.set('displayName', firebaseUser.displayName);
      syncProfile = true;
    } else if (displayName /* && !firebaseUser.displayName */) {
      console.log($FUNC, 'Updating Firebase display name...');
      await firebaseUser.updateProfile({ displayName });
    }

    const provider: string | undefined = profile.get('provider');
    const firebaseProviderId = firebaseUser.providerData[0]?.providerId;
    if (!provider && firebaseProviderId) {
      profile.set('provider', firebaseProviderId);
      syncProfile = true;
    }

    const phone: string | undefined = profile.get('phone');
    if (!phone && firebaseUser.phoneNumber) {
      profile.set('phone', firebaseUser.phoneNumber);
      syncProfile = true;
    }

    const email: string | undefined = profile.get('email');
    if (!email && firebaseUser.email) {
      profile.set('email', firebaseUser.email);
      syncProfile = true;
    }

    const avatar: MediaSource | undefined = profile.get('avatar');
    if (!avatar && firebaseUser.photoURL) {
      profile.set('avatar', {
        url: firebaseUser.photoURL,
        ...DEFAULT_AVATAR_DIMENSIONS,
      });
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
    const $FUNC = '[AuthApi.attemptToFetchProfileForUser]';
    const MAX_ATTEMPTS = 3;

    console.log($FUNC, 'Querying profile...');
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    query.equalTo('owner', currentUser.toPointer());

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
    const $FUNC = '[AuthApi.authenticateViaParse]';

    const authData = {
      access_token: await firebaseUser.getIdToken(),
      id: firebaseUser.uid,
    };

    let currentUser = await Parse.User.currentAsync();
    if (!currentUser) {
      console.info(
        $FUNC,
        'Current user not found. Logging in with Firebase...',
      );
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

  export async function signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedResult> {
    const $FUNC = '[AuthApi.signInWithEmailAndPassword]';
    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      console.log($FUNC, 'Authenticating via Firebase...');
      const cred = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = cred.user;
      didLoginViaFirebase = true;

      if (cred.additionalUserInfo?.isNewUser) {
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

      // We won't await for analytics, nor do we care if it fails.
      console.log($FUNC, 'Sending analytics...');
      analytics()
        .logLogin({ method: 'email' })
        .then(() => analytics().setUserId(String(authenticatedUser.profileId)))
        .catch(err => console.error($FUNC, 'Failed to send analytics:', err));

      return [authenticatedUser, currentSession.id as SessionId];
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error($FUNC, 'Failed to sign in with email and password:', error);
      throw error;
    }
  }

  export async function signInWithCredential(
    credential: FirebaseAuthTypes.AuthCredential,
  ): Promise<AuthenticatedResult> {
    const $FUNC = '[AuthApi.signInWithCredential]';
    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      console.log($FUNC, 'Authenticating via Firebase...');
      const cred = await auth().signInWithCredential(credential);
      const firebaseUser = cred.user;
      didLoginViaFirebase = true;

      const authenticatedUser = await authenticateViaParse(firebaseUser);
      const currentSession = await Parse.Session.current();
      didLoginViaParse = true;

      // We won't await for analytics, nor do we care if it fails.
      console.log($FUNC, 'Sending analytics...');
      const eventParams = { method: credential.providerId };
      const analyticsPromise = cred.additionalUserInfo?.isNewUser
        ? analytics().logSignUp(eventParams)
        : analytics().logLogin(eventParams);

      const setUserId = async () => {
        if (authenticatedUser.profileId)
          await analytics().setUserId(authenticatedUser.profileId.toString());
      };

      analyticsPromise
        .then(setUserId)
        .then(() => console.log($FUNC, 'Successfully sent analytics'))
        .catch(err => console.error($FUNC, 'Failed to send analytics:', err));

      return [authenticatedUser, currentSession.id as SessionId];
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error($FUNC, 'Failed to sign in with credential:', error);
      throw error;
    }
  }

  export async function registerNewAccount(
    displayName: string,
    username: string,
    email: string,
    password: string,
  ): Promise<AuthenticatedResult> {
    const $FUNC = '[AuthApi.registerNewAccount]';
    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      const checkUsernameAvailable = async (username: string) => {
        const query = new Parse.Query(Parse.Object.extend('Profile'));
        query.equalTo('username', username);
        return (await query.findAll()).length === 0;
      };

      if (!(await checkUsernameAvailable(username))) {
        // This will be handled by LoginScreen
        throw new AuthApiError(
          'USERNAME_TAKEN',
          'The provided username is already taken.',
        );
      }

      console.log($FUNC, 'Creating new user via Firebase...');
      const { user: firebaseUser } =
        await auth().createUserWithEmailAndPassword(email, password);
      didLoginViaFirebase = true;

      console.log($FUNC, 'Updating Firebase profile...');
      await firebaseUser.updateProfile({ displayName });

      const authData = {
        access_token: await firebaseUser.getIdToken(),
        id: firebaseUser.uid,
      };

      console.log($FUNC, 'Authenticating via Parse...');
      const newParseUser = await Parse.User.logInWith('firebase', { authData });
      console.log($FUNC, 'Successfully logged in via Parse:', newParseUser.id);
      didLoginViaParse = true;

      const newProfile = await attemptToFetchProfileForUser(newParseUser);
      if (!newProfile) {
        console.error(
          $FUNC,
          'No profile was found with user ID',
          newParseUser.id,
        );

        throw new AuthApiError(
          'NO_PROFILE_FOUND',
          'No profile was found with the given user ID.',
        );
      }

      // newProfile.set('fullName', fullName);
      newProfile.set('displayName', displayName);
      newProfile.set('username', username);
      newProfile.set('email', email);

      const providerId = firebaseUser.providerData[0]?.providerId;
      if (providerId) {
        newProfile.set('provider', providerId);
      }

      console.log($FUNC, 'Saving new profile details...');
      await newProfile.save();

      // // We won't await for analytics, nor do we care if it fails.
      // console.log($FUNC, 'Sending analytics...');
      // analytics()
      //   .logSignUp({ method: 'email' })
      //   .then(() => analytics().setUserId(newProfile.id))
      //   .catch(err => console.error($FUNC, 'Failed to send analytics:', err));

      const user: User = {
        id: newParseUser.id as UserId,
        provider: providerId,
        profileId: newProfile.id as ProfileId,
      };

      const currentSession = await Parse.Session.current();

      return [user, currentSession.id as SessionId];
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error($FUNC, 'Failed to register account:', error);
      throw error;
    }
  }

  export async function signOut(logoutParse = true, logoutFirebase = true) {
    const $FUNC = '[AuthApi.signOut]';

    if (logoutParse) {
      console.log($FUNC, 'Signing out via Parse...');
      await Parse.User.logOut();
    }

    if (logoutFirebase) {
      console.log($FUNC, 'Signing out via Firebase...');
      await auth().signOut();
      await analytics().setUserId(null);
    }
  }
}
