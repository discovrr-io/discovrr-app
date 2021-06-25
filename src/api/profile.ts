import Parse from 'parse/react-native';

import Profile from '../models/profile';
import { ImageSource } from '../models/common';
import {
  DEFAULT_AVATAR,
  DEFAULT_AVATAR_DIMENSIONS,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_DIMENSIONS,
} from '../constants/media';
import { MediaSource } from '.';

export namespace ProfileApi {
  function mapResultToProfile(result: Parse.Object<Parse.Attributes>): Profile {
    const avatar: MediaSource | undefined = result.get('avatar');
    let profileAvatar: ImageSource;
    if (avatar) {
      profileAvatar = {
        uri: avatar.url,
        width: avatar.width ?? DEFAULT_AVATAR_DIMENSIONS.width,
        height: avatar.height ?? DEFAULT_AVATAR_DIMENSIONS.height,
      };
    } else {
      profileAvatar = DEFAULT_AVATAR;
    }

    const coverPhoto: MediaSource | undefined = result.get('coverPhoto');
    let profileCoverPhoto: ImageSource;
    if (coverPhoto) {
      profileCoverPhoto = {
        uri: coverPhoto.url,
        width: coverPhoto.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
        height: coverPhoto.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      };
    } else {
      profileCoverPhoto = DEFAULT_IMAGE;
    }

    return {
      id: result.id,
      email: result.get('email') ?? '',
      fullName:
        result.get('fullName') ||
        result.get('name') ||
        result.get('displayName') ||
        '',
      username: result.get('username') ?? '',
      avatar: profileAvatar,
      coverPhoto: profileCoverPhoto,
      description: result.get('description') ?? '',
      isVendor: false, // TODO: Determine if profile is vendor
      followers: result.get('followersArray') ?? [],
      following: result.get('followingArray') ?? [],
    } as Profile;
  }

  export async function fetchAllProfiles(): Promise<Profile[]> {
    try {
      console.group('ProfileApi.fetchAllProfiles');
      const query = new Parse.Query('Profile');
      const results = await query.findAll();
      return results.map(mapResultToProfile);
    } catch (error) {
      console.error('Failed to fetch all profiles:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  export async function fetchProfileById(
    profileId: string,
  ): Promise<Profile | null> {
    try {
      console.group('ProfileApi.fetchProfileById');
      const query = new Parse.Query('Profile');
      query.equalTo('objectId', profileId);
      const result = await query.first();
      if (result) {
        return mapResultToProfile(result);
      } else {
        console.warn('No profile found with id:', profileId);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch profile by id:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
}
