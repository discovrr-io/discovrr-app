import Parse from 'parse/react-native';

import { Profile, ProfileId } from 'src/models';
import { Pagination } from 'src/models/common';

import { ApiError, CommonApiErrorCode } from './common';

export namespace ProfileApi {
  export type ProfileApiErrorCode = CommonApiErrorCode | 'PROFILE_NOT_FOUND';
  export class ProfileApiError extends ApiError<ProfileApiErrorCode> {}

  function mapResultToProfile(result: Parse.Object): Profile {
    return {
      id: result.id as ProfileId,
      displayName:
        result.get('displayName') ||
        result.get('fullName') ||
        result.get('name') ||
        'Anonymous',
      username: result.get('username') ?? '',
      email: result.get('email') ?? '',
      isVendor: false, // TODO: Determine if profile is vendor
      avatar: result.get('avatar'),
      coverPhoto: result.get('coverPhoto'),
      description: result.get('description'),
      biography: result.get('biography') || result.get('description'),
      followers: result.get('followersArray'),
      following: result.get('followingArray'),
    };
  }

  export async function fetchProfileById(profileId: string): Promise<Profile> {
    const query = new Parse.Query('Profile');
    query.equalTo('objectId', profileId);

    const result = await query.first();
    if (!result) {
      throw new ProfileApiError(
        'PROFILE_NOT_FOUND',
        `No profile was found with the ID '${profileId}'.`,
      );
    }

    return mapResultToProfile(result);
  }

  export async function fetchAllProfiles(
    pagination?: Pagination,
  ): Promise<Profile[]> {
    const query = new Parse.Query('Profile');

    if (pagination) {
      query.limit(pagination.limit);
      query.skip(pagination.limit * pagination.currentPage);
    }

    const results = await query.findAll();
    return results.map(mapResultToProfile);
  }

  export type ProfileChanges = Partial<
    Omit<Profile, 'id' | 'followers' | 'following'>
  >;

  export async function updateProfile(
    profileId: string,
    changes: ProfileChanges,
  ) {
    const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
    profileQuery.equalTo('objectId', profileId);

    const profile = await profileQuery.first();
    await profile?.save(changes);
  }

  export async function updateProfileFollowStatus(
    profileId: string,
    didFollow: boolean,
  ) {
    await Parse.Cloud.run('updateProfileFollowStatus', {
      followeeId: profileId,
      didFollow,
    });
  }

  export async function generateRandomUsername(): Promise<string> {
    return await Parse.Cloud.run('generateRandomUsername');
  }
}
