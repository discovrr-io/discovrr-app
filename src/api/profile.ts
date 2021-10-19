import Parse from 'parse/react-native';
import { EntityId } from '@reduxjs/toolkit';

import { Profile, ProfileId } from 'src/models';
import { Pagination } from 'src/models/common';
import {
  CommonProfileDetails,
  PersonalProfileId,
  SharedProfileDetails,
  VendorProfileId,
} from 'src/models/profile';

import { ApiObjectStatus } from '.';
import { ApiError, CommonApiErrorCode } from './common';

export namespace ProfileApi {
  export type ProfileApiErrorCode =
    | CommonApiErrorCode
    | 'PROFILE_NOT_FOUND'
    | 'INVALID_PROFILE_KIND';
  export class ProfileApiError extends ApiError<ProfileApiErrorCode> {}

  function constructCommonProfileDetails<Id extends EntityId>(
    profileId: Parse.Object['id'],
    object: Parse.Object,
  ): CommonProfileDetails<Id> {
    return {
      id: object.id as Id,
      profileId: profileId as ProfileId,
      status: object.get('status') ?? ApiObjectStatus.READY,
      avatar: object.get('avatar'),
      coverPhoto: object.get('coverPhoto'),
    };
  }

  function mapResultToProfile(result: Parse.Object): Profile {
    const kind: string = result.get('kind');

    const sharedProfileDetails: SharedProfileDetails = {
      email: result.get('email') ?? '',
      username: result.get('username') ?? '',
      displayName: result.get('displayName') ?? '',
      biography: result.get('biography'),
      // TODO: Compute this through a query instead
      followers: result.get('followersArray') ?? [],
      following: result.get('followingArray') ?? [],
      blocked: result.get('blockedArray') ?? [],
    };

    if (kind === 'personal') {
      const personalProfile: Parse.Object = result.get('personalProfile');
      if (!personalProfile)
        throw new ProfileApiError(
          'PROFILE_NOT_FOUND',
          `No personal profile was found for profile '${result.id}'.`,
        );

      const commonProfileDetails =
        constructCommonProfileDetails<PersonalProfileId>(
          result.id,
          personalProfile,
        );

      return {
        kind: 'personal',
        ...commonProfileDetails,
        ...sharedProfileDetails,
      };
    } else if (kind === 'vendor') {
      const vendorProfile: Parse.Object = result.get('vendorProfile');
      if (!vendorProfile)
        throw new ProfileApiError(
          'PROFILE_NOT_FOUND',
          `No vendor profile was found for profile '${result.id}'.`,
        );

      const commonProfileDetails =
        constructCommonProfileDetails<VendorProfileId>(
          result.id,
          vendorProfile,
        );

      return {
        kind: 'vendor',
        ...commonProfileDetails,
        ...sharedProfileDetails,
      };
    }

    // We don't know how to handle this profile kind, so we'll throw an error.
    throw new ProfileApiError(
      'INVALID_PROFILE_KIND',
      `Invalid profile kind '${kind}'.`,
    );
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
    query.include('personalProfile', 'vendorProfile');
    query.notEqualTo('status', ApiObjectStatus.DELETED);

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
    query.include('personalProfile', 'vendorProfile');
    query.notEqualTo('status', ApiObjectStatus.DELETED);

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

  export async function updateProfile(_params: UpdateProfileParams) {
    // const { profileId, changes } = params;
    // const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
    // const profile = await profileQuery.get(String(profileId));
    // await profile?.save(changes);
    throw new ProfileApiError(
      'UNIMPLEMENTED',
      'Not implemented: `ProfileAPi.updateProfile`.',
    );
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
