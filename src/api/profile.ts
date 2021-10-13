import Parse from 'parse/react-native';

import { Profile, ProfileId } from 'src/models';
import { Pagination } from 'src/models/common';
import { ApiObjectStatus } from '.';

import { ApiError, CommonApiErrorCode } from './common';

export namespace ProfileApi {
  export type ProfileApiErrorCode = CommonApiErrorCode | 'PROFILE_NOT_FOUND';
  export class ProfileApiError extends ApiError<ProfileApiErrorCode> {}

  function mapResultToProfile(result: Parse.Object): Profile {
    return {
      id: result.id as ProfileId,
      kind: result.get('kind') ?? 'personal',
      email: result.get('email') ?? '',
      displayName: result.get('displayName') || 'Anonymous',
      username: result.get('username') ?? '',
      biography: result.get('biography') || result.get('description'),
      avatar: result.get('avatar'),
      coverPhoto: result.get('coverPhoto'),
      followers: result.get('followersArray'),
      following: result.get('followingArray'),
      blocked: result.get('blockedArray'),
      status: result.get('status') ?? ApiObjectStatus.READY,
    };
  }

  export async function generateRandomUsername(): Promise<string> {
    return await Parse.Cloud.run('generateRandomUsername');
  }

  //#region READ OPERATIONS

  export type FetchProfileByIdParams = {
    profileId: ProfileId;
  };

  export async function fetchProfileById(
    params: FetchProfileByIdParams,
  ): Promise<Profile> {
    const { profileId } = params;
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    const result = await query.get(String(profileId));
    return mapResultToProfile(result);
  }

  export type FetchAllProfilesParams = {
    pagination?: Pagination;
  };

  export async function fetchAllProfiles(
    params: FetchAllProfilesParams = {},
  ): Promise<Profile[]> {
    const { pagination } = params;
    const query = new Parse.Query(Parse.Object.extend('Profile'));

    if (pagination) {
      query.limit(pagination.limit);
      query.skip(pagination.limit * pagination.currentPage);
    }

    const results = await query.findAll();
    return results.map(mapResultToProfile);
  }

  //#endregion READ OPERATIONS

  //#region UPDATE OPERATIONS

  export type ProfileChanges = Partial<
    Pick<
      Profile,
      | 'displayName'
      | 'email'
      | 'username'
      | 'biography'
      | 'avatar'
      | 'coverPhoto'
    >
  >;

  export type UpdateProfileParams = {
    profileId: ProfileId;
    changes: ProfileChanges;
  };

  export async function updateProfile(params: UpdateProfileParams) {
    const { profileId, changes } = params;
    const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
    const profile = await profileQuery.get(String(profileId));
    await profile?.save(changes);
  }

  export type UpdateProfileFollowStatusParams = {
    profileId: ProfileId;
    didFollow: boolean;
  };

  export async function updateProfileFollowStatus(
    params: UpdateProfileFollowStatusParams,
  ) {
    const { profileId, ...restParams } = params;
    await Parse.Cloud.run('updateProfileFollowStatus', {
      ...restParams,
      followeeId: String(profileId),
    });
  }

  //#endregion UPDATE OPERATIONS
}
