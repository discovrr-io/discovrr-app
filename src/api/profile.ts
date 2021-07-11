import Parse from 'parse/react-native';

import { MediaSource } from '.';
import { Profile } from '../models';
import { ImageSource, Pagination } from '../models/common';

import {
  DEFAULT_AVATAR,
  DEFAULT_AVATAR_DIMENSIONS,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_DIMENSIONS,
} from '../constants/media';

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
      followers: result.get('followersArray'),
      following: result.get('followingArray'),
    } as Profile;
  }

  export async function fetchAllProfiles(
    pagination?: Pagination,
  ): Promise<Profile[]> {
    const FUNC = '[ProfileApi.fetchAllProfiles]';

    try {
      const query = new Parse.Query('Profile');

      if (pagination) {
        query.limit(pagination.limit);
        query.skip(pagination.limit * pagination.currentPage);
      }

      const results = await query.findAll();
      return results.map(mapResultToProfile);
    } catch (error) {
      console.error(FUNC, 'Failed to fetch all profiles:', error);
      throw error;
    }
  }

  export async function fetchProfileById(
    profileId: string,
  ): Promise<Profile | null> {
    const FUNC = '[ProfileApi.fetchProfileById]';

    try {
      const query = new Parse.Query('Profile');
      query.equalTo('objectId', profileId);
      const result = await query.first();
      if (result) {
        return mapResultToProfile(result);
      } else {
        console.warn(FUNC, 'No profile found with id:', profileId);
        return null;
      }
    } catch (error) {
      console.error(FUNC, 'Failed to fetch profile by id:', error);
      throw error;
    }
  }

  export async function changeProfileFollowStatus(
    profileId: string,
    didFollow: boolean,
  ) {
    const FUNC = '[ProfileApi.changeProfileFollowStatus]';

    try {
      await Parse.Cloud.run('followOrUnfollowProfile', {
        profileId,
        follow: didFollow,
      });
    } catch (error) {
      console.error(
        FUNC,
        `Failed to ${didFollow ? 'follow' : 'unfollow'} profile with id:`,
        error,
      );
      throw error;
    }
  }

  /**
   * @deprecated The `oneSignalPlayerIds` column will be deleted soon
   */
  export async function getOneSignalPlayerIdsForProfile(
    profileId: string,
  ): Promise<string[]> {
    const FUNC = '[ProfileApi.getOneSignalPlayerIdsForProfile]';

    try {
      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
      profileQuery.equalTo('objectId', profileId);

      const result = await profileQuery.first();
      if (result) {
        return result.get('oneSignalPlayerIds') ?? [];
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        FUNC,
        'Failed to get OneSignal player IDs for profile:',
        profileId,
      );
      throw error;
    }
  }
}
