import analytics from '@react-native-firebase/analytics';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import Parse from 'parse/react-native';

import { MediaSource } from '.';
import { User } from '../models';
import { DEFAULT_AVATAR_DIMENSIONS } from '../constants/media';

const MAX_ATTEMPTS = 3;

export namespace AuthApi {
  export enum AuthApiError {
    // NO_PROFILE_FOUND = '1000',
    USERNAME_ALREADY_TAKEN = '2000',
  }

  async function syncAndConstructUser(
    currentUserId: string,
    profile: Parse.Object<Parse.Attributes>,
    firebaseUser: FirebaseAuthTypes.User,
  ): Promise<User> {
    const $FUNC = '[AuthApi.syncAndConstructUser]';
    let syncProfile = false;

    const fullName: string | undefined =
      profile.get('fullName') ||
      profile.get('name') ||
      profile.get('displayName');
    if (!fullName && firebaseUser.displayName) {
      profile.set('fullName', firebaseUser.displayName ?? '');
      syncProfile = true;
    } else if (fullName /* && !firebaseUser.displayName */) {
      console.log($FUNC, 'Updating Firebase display name...');
      await firebaseUser.updateProfile({ displayName: fullName });
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
      provider: firebaseUser.providerId,
      profileId: profile.id,
    } as User;
  }

  async function signInWithParse(
    firebaseUser: FirebaseAuthTypes.User,
  ): Promise<User> {
    const $FUNC = '[AuthApi.signInWithParse]';

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

    console.log($FUNC, 'Querying profile...');
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    query.equalTo('owner', currentUser.toPointer());

    let profile = await query.first();
    console.log($FUNC, 'Found Parse profile:', profile?.id);

    let attempts = 0;
    while (!profile && attempts < MAX_ATTEMPTS) {
      console.warn($FUNC, `Current user profile ID not found.`);
      console.log($FUNC, `(Attempt ${attempts + 1} of ${MAX_ATTEMPTS})`);
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          const result = await query.first();
          profile = result;
          attempts += 1;
          resolve();
        }, 2000);
      });
    }

    if (!profile) {
      throw new Error(`No profile was found with user id '${currentUser.id}'.`);
    }

    return await syncAndConstructUser(currentUser.id, profile, firebaseUser);
  }

  export async function signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<User> {
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

      console.log($FUNC, 'Signing in via Parse...');
      const authenticatedUser = await signInWithParse(firebaseUser);
      didLoginViaParse = true;

      await analytics().logLogin({ method: 'email' });
      await analytics().setUserId(authenticatedUser.profileId.toString());

      return authenticatedUser;
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error($FUNC, 'Failed to sign in with email and password:', error);
      throw error;
    }
  }

  export async function signInWithCredential(
    credential: FirebaseAuthTypes.AuthCredential,
  ) {
    const $FUNC = '[AuthApi.signInWithCredential]';
    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      console.log($FUNC, 'Authenticating via Firebase...');
      const cred = await auth().signInWithCredential(credential);
      const firebaseUser = cred.user;
      didLoginViaFirebase = true;

      const authenticatedUser = await signInWithParse(firebaseUser);
      didLoginViaParse = true; // We'll put this before to force Parse logout

      if (cred.additionalUserInfo?.isNewUser) {
        console.log($FUNC, 'Signed up new user via', credential.providerId);
        await analytics().logSignUp({ method: credential.providerId });
      } else {
        await analytics().logLogin({ method: credential.providerId });
      }

      if (authenticatedUser.profileId) {
        await analytics().setUserId(authenticatedUser.profileId.toString());
      }

      return authenticatedUser;
    } catch (error) {
      console.warn($FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error($FUNC, 'Failed to sign in with credential:', error);
      throw error;
    }
  }

  export async function registerNewAccount(
    fullName: string,
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
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
        throw {
          code: AuthApiError.USERNAME_ALREADY_TAKEN,
          message: 'The provided username is already taken.',
        };
      }

      console.log($FUNC, 'Creating new user via Firebase...');
      const { user: firebaseUser } =
        await auth().createUserWithEmailAndPassword(email, password);
      didLoginViaFirebase = true;

      console.log($FUNC, 'Updating Firebase profile...');
      await firebaseUser.updateProfile({ displayName: fullName });

      const authData = {
        access_token: await firebaseUser.getIdToken(),
        id: firebaseUser.uid,
      };

      const currentUser = await Parse.User.logInWith('firebase', { authData });
      console.log(
        $FUNC,
        'Successfully logged in with Firebase:',
        currentUser.id,
      );
      didLoginViaParse = true;

      const Profile = Parse.Object.extend('Profile');
      const profile: Parse.Object<Parse.Attributes> = new Profile();

      console.log($FUNC, 'Creating new profile with owner:', currentUser.id);
      profile.set('owner', currentUser);
      profile.set('fullName', fullName);
      profile.set('username', username);
      profile.set('email', email);
      profile.set('provider', firebaseUser.providerId);

      const newProfile = await profile.save();
      console.log(
        $FUNC,
        'Successfully created new profile with objectId:',
        newProfile.id,
      );

      await analytics().logSignUp({ method: 'email' });
      await analytics().setUserId(newProfile.id);

      // // TODO: We might want to prevent syncing some fields since this is a new
      // // profile anyway
      // return await syncAndConstructUser(newProfile, firebaseUser);

      return {
        provider: firebaseUser.providerId,
        profileId: newProfile.id,
      } as User;
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
      // await analytics().setUserId(null)
    }
  }
}
