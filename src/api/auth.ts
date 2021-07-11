import analytics from '@react-native-firebase/analytics';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import Parse from 'parse/react-native';

import { MediaSource } from '.';
import { User } from '../models';
import { ImageSource } from '../models/common';
import {
  DEFAULT_AVATAR,
  DEFAULT_AVATAR_DIMENSIONS,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_DIMENSIONS,
} from '../constants/media';

export namespace AuthApi {
  export enum AuthApiError {
    NO_PROFILE_FOUND = '1000',
    USERNAME_ALREADY_TAKEN = '2000',
  }

  async function syncAndConstructUser(
    profile: Parse.Object<Parse.Attributes>,
    firebaseUser: FirebaseAuthTypes.User,
  ) {
    const FUNC = '[AuthApi.syncAndConstructUser]';
    let syncProfile = false;

    let fullName: string | undefined =
      profile.get('fullName') ||
      profile.get('name') ||
      profile.get('displayName');
    if (!fullName && firebaseUser.displayName) {
      fullName = firebaseUser.displayName;
      profile.set('fullName', firebaseUser.displayName ?? '');
      syncProfile = true;
    } else if (fullName /* && !firebaseUser.displayName */) {
      console.log(FUNC, 'Updating Firebase display name...');
      await firebaseUser.updateProfile({ displayName: fullName });
    }

    // let phone: string | undefined = profile.get('phone');
    // if (!phone && firebaseUser.phoneNumber) {
    //   profile.set('phone', firebaseUser.phoneNumber);
    //   syncProfile = true;
    // }

    // May be undefined if anonymous
    let email: string | undefined = profile.get('email');
    if (!email && firebaseUser.email) {
      email = firebaseUser.email;
      profile.set('email', firebaseUser.email);
      syncProfile = true;
    }

    let avatar: ImageSource;
    const foundAvatar: MediaSource | undefined = profile.get('avatar');
    if (foundAvatar && foundAvatar.url) {
      avatar = {
        uri: foundAvatar.url,
        width: foundAvatar.width ?? DEFAULT_AVATAR_DIMENSIONS.width,
        height: foundAvatar.height ?? DEFAULT_AVATAR_DIMENSIONS.height,
      };
    } else if (!foundAvatar && firebaseUser.photoURL) {
      avatar = { uri: firebaseUser.photoURL, ...DEFAULT_AVATAR_DIMENSIONS };
      profile.set('avatar', {
        url: firebaseUser.photoURL,
        ...DEFAULT_AVATAR_DIMENSIONS,
      });
      syncProfile = true;
    } else {
      avatar = DEFAULT_AVATAR;
    }

    let coverPhoto: ImageSource;
    const foundCoverPhoto: MediaSource | undefined = profile.get('coverPhoto');
    if (foundCoverPhoto) {
      coverPhoto = {
        uri: foundCoverPhoto.url,
        width: foundCoverPhoto.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
        height: foundCoverPhoto.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      };
    } else {
      coverPhoto = DEFAULT_IMAGE;
    }

    if (syncProfile) {
      try {
        console.log(FUNC, 'Syncing profile...');
        await profile.save();
      } catch (error) {
        // We'll continue the authentication process regardless of the
        // synchronisation outcome
        console.error(FUNC, 'Failed to synchronise profile:', error);
      }
    }

    return {
      provider: firebaseUser.providerId,
      profile: {
        id: profile.id,
        fullName: fullName || '',
        username: profile.get('username') ?? '',
        email: email || '',
        avatar,
        coverPhoto,
        isVendor: false,
        description: profile.get('description'),
      },
    };
  }

  async function signInWithParse(
    firebaseUser: FirebaseAuthTypes.User,
  ): Promise<User> {
    const FUNC = '[AuthApi.signInWithParse]';

    const authData = {
      access_token: await firebaseUser.getIdToken(),
      id: firebaseUser.uid,
    };

    let currentUser = await Parse.User.currentAsync();
    if (!currentUser) {
      console.info('Current user not found. Logging in with Firebase...');
      currentUser = await Parse.User.logInWith('firebase', { authData });
      console.log(
        FUNC,
        'Successfully logged in with Firebase via Parse:',
        currentUser.id,
      );
    }

    console.log(FUNC, 'Querying profile...');
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    query.equalTo('owner', currentUser);

    const profile = await query.first();
    console.log(FUNC, 'Found Parse profile:', profile?.id);

    if (!profile) {
      console.error(
        FUNC,
        'Failed to find profile with owner ID:',
        currentUser.id,
      );
      // This will be handled by LoginScreen
      throw {
        code: AuthApiError.NO_PROFILE_FOUND,
        message: 'No profile with the provided owner ID was found.',
      };
    }

    return await syncAndConstructUser(profile, firebaseUser);
  }

  export async function signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<User> {
    const FUNC = '[AuthApi.signInWithEmailAndPassword]';
    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      const { user } = await auth().signInWithEmailAndPassword(email, password);
      didLoginViaFirebase = true;

      const authenticatedUser = await signInWithParse(user);
      await analytics().logLogin({ method: 'email' });
      await analytics().setUserId(authenticatedUser.profile.id.toString());
      didLoginViaParse = true;

      return authenticatedUser;
    } catch (error) {
      console.warn(FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error(FUNC, 'Failed to sign in with email and password:', error);
      throw error;
    }
  }

  export async function signInWithCredential(
    credential: FirebaseAuthTypes.AuthCredential,
  ) {
    const FUNC = '[AuthApi.signInWithCredential]';
    let didLoginViaFirebase = false;
    let didLoginViaParse = false;

    try {
      const userCredential = await auth().signInWithCredential(credential);
      didLoginViaFirebase = true;

      const authenticatedUser = await signInWithParse(userCredential.user);
      didLoginViaParse = true;

      if (userCredential.additionalUserInfo?.isNewUser) {
        console.log(FUNC, 'New user signing up with', credential.providerId);
        await analytics().logSignUp({ method: credential.providerId });
      } else {
        await analytics().logLogin({ method: credential.providerId });
      }

      await analytics().setUserId(authenticatedUser.profile.id.toString());

      return authenticatedUser;
    } catch (error) {
      console.warn(FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error(FUNC, 'Failed to sign in with credential:', error);
      throw error;
    }
  }

  export async function registerNewAccount(
    fullName: string,
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
    const FUNC = '[AuthApi.registerNewAccount]';
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

      console.log(FUNC, 'Creating new user via Firebase...');
      const { user: firebaseUser } =
        await auth().createUserWithEmailAndPassword(email, password);
      didLoginViaFirebase = true;

      console.log(FUNC, 'Updating Firebase profile...');
      await firebaseUser.updateProfile({ displayName: fullName });

      const authData = {
        access_token: await firebaseUser.getIdToken(),
        id: firebaseUser.uid,
      };

      const currentUser = await Parse.User.logInWith('firebase', { authData });
      console.log(FUNC, 'Successfully logged in with Firebase:', currentUser);
      didLoginViaParse = true;

      const Profile = Parse.Object.extend('Profile');
      const profile: Parse.Object<Parse.Attributes> = new Profile();

      console.log(FUNC, 'Creating new profile with owner:', currentUser.id);
      profile.set('owner', currentUser);
      profile.set('fullName', fullName);
      profile.set('username', username);
      profile.set('email', email);

      const newProfile = await profile.save();
      console.log(
        FUNC,
        'Successfully created new profile with objectId:',
        newProfile.id,
      );

      await analytics().logSignUp({ method: 'email' });
      await analytics().setUserId(newProfile.id);

      // TODO: We might want to prevent syncing some fields since this is a new
      // profile anyway
      return await syncAndConstructUser(newProfile, firebaseUser);
    } catch (error) {
      console.warn(FUNC, 'Aborting authentication. Signing out...');
      await signOut(didLoginViaParse, didLoginViaFirebase);
      console.error(FUNC, 'Failed to register account:', error);
      throw error;
    }
  }

  export async function signOut(logoutParse = true, logoutFirebase = true) {
    const FUNC = '[AuthApi.signOut]';

    if (logoutParse) {
      console.log(FUNC, 'Signing out via Parse...');
      await Parse.User.logOut();
    }

    if (logoutFirebase) {
      console.log(FUNC, 'Signing out via Firebase...');
      await auth().signOut();
      // await analytics().setUserId(null)
    }
  }
}
