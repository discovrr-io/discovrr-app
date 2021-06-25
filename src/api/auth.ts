import auth from '@react-native-firebase/auth';
import Parse from 'parse/react-native';

import { User } from '../models';
import { ImageSource } from '../models/common';
import { DEFAULT_AVATAR_DIMENSIONS } from '../constants/media';
import { MediaSource } from '.';

const DEFAULT_AVATAR = require('../../resources/images/defaultAvatar.jpeg');

export namespace AuthApi {
  export async function signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<User> {
    try {
      console.group('AuthApi.signInWithEmailAndPassword');

      const { user: firebaseUser } = await auth().signInWithEmailAndPassword(
        email,
        password,
      );

      let currentUser = await Parse.User.currentAsync();
      if (!currentUser) {
        console.log('Current user not found');

        const authData = {
          access_token: await firebaseUser.getIdToken(),
          id: firebaseUser.uid,
        };

        currentUser = await Parse.User.logInWith('firebase', { authData });
        console.log(
          'Successfully logged in with Firebase via Parse:',
          currentUser.id,
        );
      } else {
        console.log('Current user found');
      }

      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
      profileQuery.equalTo('owner', currentUser);

      const profile = await profileQuery.first();
      console.log('Found Parse profile:', profile?.id);

      if (!profile) {
        throw new Error('auth-api/no-profile-found');
      }

      let syncProfile = false;

      let fullName: string | undefined =
        profile.get('fullName') ||
        profile.get('name') ||
        profile.get('displayName');
      if (!fullName && firebaseUser.displayName) {
        profile.set('fullName', firebaseUser.displayName ?? '');
        syncProfile = true;
      } else if (fullName) {
        console.log('Updating Firebase display name...');
        await firebaseUser.updateProfile({ displayName: fullName });
      }

      // let phone: string | undefined = profile.get('phone');
      // if (!phone && firebaseUser.phoneNumber) {
      //   profile.set('phone', firebaseUser.phoneNumber);
      //   syncProfile = true;
      // }

      // May be undefined if anonymous
      // Note: There is already a variable named `email` before this line
      let emailAddress: string | undefined = profile.get('email');
      if (!emailAddress && firebaseUser.email) {
        profile.set('email', firebaseUser.email);
        syncProfile = true;
      }

      let avatar: ImageSource | undefined;
      const foundAvatar: MediaSource | undefined = profile.get('avatar');
      if (foundAvatar && foundAvatar.url) {
        avatar = {
          uri: foundAvatar.url,
          width: foundAvatar.width ?? 200,
          height: foundAvatar.height ?? 200,
        };
      } else if (!foundAvatar && firebaseUser.photoURL) {
        avatar = { uri: firebaseUser.photoURL, ...DEFAULT_AVATAR_DIMENSIONS };
        profile.set('avatar', {
          url: firebaseUser.photoURL,
          ...DEFAULT_AVATAR_DIMENSIONS,
        });
        syncProfile = true;
      }

      if (syncProfile) await profile.save();

      return {
        profile: {
          id: profile.id,
          email: emailAddress ?? '',
          fullName: fullName ?? '',
          username: profile.get('username') ?? '',
          isVendor: false,
          avatar: avatar ?? DEFAULT_AVATAR,
        },
        settings: {
          locationPreference: undefined, // TODO: Implement this
        },
      } as User;
    } catch (error) {
      console.error('Failed to sign in with email and password:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  export async function signOut() {
    try {
      console.group('AuthApi.signOut');

      console.log('Signing out via Parse...');
      await Parse.User.logOut();

      console.log('Signing out via Firebase...');
      await auth().signOut();
    } finally {
      console.groupEnd();
    }
  }
}
