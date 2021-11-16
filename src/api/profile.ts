import Parse from 'parse/react-native';
import { EntityId } from '@reduxjs/toolkit';

import { Profile, ProfileId } from 'src/models';
import { Pagination } from 'src/models/common';
import {
  CommonProfileDetails,
  PersonalProfileId,
  ProfileKind,
  SharedProfileDetails,
  VendorProfileId,
} from 'src/models/profile';

import { ApiError, ApiObjectStatus, CommonApiErrorCode } from './common';
import { UserApi } from './user';

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
    };
  }

  function mapResultToProfile(result: Parse.Object): Profile {
    const sharedProfileDetails: SharedProfileDetails = {
      email: result.get('email') ?? '',
      username: result.get('username') ?? '',
      displayName: result.get('displayName') ?? '',
      avatar: result.get('avatar'),
      coverPhoto: result.get('coverPhoto'),
      background: result.get('background'),
      backgroundThumbnail: result.get('backgroundThumbnail'),
      biography: result.get('biography'),
      // TODO: Compute this through a query instead
      followers: result.get('followersArray') ?? [],
      following: result.get('followingArray') ?? [],
      blocked: result.get('blockedArray') ?? [],
    };

    const kind: string | undefined = result.get('kind');

    if (kind === 'personal') {
      const profilePersonal: Parse.Object = result.get('profilePersonal');
      if (!profilePersonal)
        throw new ProfileApiError(
          'PROFILE_NOT_FOUND',
          `No personal profile was found for profile '${result.id}'.`,
        );

      const commonProfileDetails =
        constructCommonProfileDetails<PersonalProfileId>(
          result.id,
          profilePersonal,
        );

      if (!commonProfileDetails.profileId) {
        console.error('NO PROFILE ID SET:', result.id);
      }

      return {
        kind: 'personal',
        ...commonProfileDetails,
        ...sharedProfileDetails,
      };
    } else if (kind === 'vendor') {
      const profileVendor: Parse.Object = result.get('profileVendor');
      if (!profileVendor)
        throw new ProfileApiError(
          'PROFILE_NOT_FOUND',
          `No vendor profile was found for profile '${result.id}'.`,
        );

      const commonProfileDetails =
        constructCommonProfileDetails<VendorProfileId>(
          result.id,
          profileVendor,
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
    query.include('profilePersonal', 'profileVendor');
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
    const pagination = params.pagination;
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    query.include('profilePersonal', 'profileVendor');
    query.notEqualTo('status', ApiObjectStatus.DELETED);

    if (pagination) {
      query.limit(pagination.limit);
      query.skip(pagination.limit * pagination.currentPage);
    }

    const results = await query.findAll();
    return results.map(mapResultToProfile);
  }

  export type FetchProfileByVendorProfileIdParams = {
    vendorProfileId: VendorProfileId;
  };

  export type FetchAllProfilesByKindParams = {
    kind: ProfileKind;
    pagination?: Pagination;
  };

  export async function fetchAllProfilesByKind(
    params: FetchAllProfilesByKindParams,
  ): Promise<Profile[]> {
    const { kind, pagination } = params;
    const query = new Parse.Query(Parse.Object.extend('Profile'));
    query.include('profilePersonal', 'profileVendor');
    query.equalTo('kind', kind);
    query.notEqualTo('status', ApiObjectStatus.DELETED);

    if (kind === 'personal') {
      query.exists('profilePersonal');
    } else if (kind === 'vendor') {
      query.exists('profileVendor');
    }

    if (pagination) {
      query.limit(pagination.limit);
      query.skip(pagination.limit * pagination.currentPage);
    }

    const results = await query.findAll();
    return results.map(mapResultToProfile);
  }

  export async function fetchProfileByVendorProfileId(
    params: FetchProfileByVendorProfileIdParams,
  ): Promise<Profile> {
    const vendorId = String(params.vendorProfileId);
    const vendorQuery = new Parse.Query(Parse.Object.extend('ProfileVendor'));
    vendorQuery.include('profile');
    vendorQuery.notEqualTo('status', ApiObjectStatus.DELETED);

    const result = await vendorQuery.get(vendorId);
    const profile: Parse.Object = result.get('profile');

    return {
      kind: 'vendor',
      email: profile.get('email') ?? '',
      username: profile.get('username') ?? '',
      displayName: profile.get('displayName') ?? '',
      avatar: result.get('avatar'),
      coverPhoto: result.get('coverPhoto'),
      biography: result.get('biography'),
      followers: profile.get('followersArray') ?? [],
      following: profile.get('followingArray') ?? [],
      blocked: profile.get('blockedArray') ?? [],
      ...constructCommonProfileDetails<VendorProfileId>(profile.id, result),
    };
  }

  //#endregion READ OPERATIONS

  //#region UPDATE OPERATIONS

  export type ProfileChanges = Partial<
    Pick<Profile, 'displayName' | 'username' | 'biography'>
  > & {
    avatar?: Profile['avatar'] | null;
    coverPhoto?: Profile['coverPhoto'] | null;
  };

  export type UpdateProfileParams = {
    profileId: ProfileId;
    changes: ProfileChanges;
  };

  export async function updateProfile(params: UpdateProfileParams) {
    await Parse.Cloud.run('updateProfile', params);
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

  export type ChangeProfileKindParams = {
    kind: ProfileKind;
  };

  export async function changeProfileKind(
    params: ChangeProfileKindParams,
  ): Promise<Profile> {
    const updatedProfile = await Parse.Cloud.run('changeProfileKind', params);
    return mapResultToProfile(updatedProfile);
  }

  //#endregion UPDATE OPERATIONS

  //#region MISCELLANEOUS

  export type SubmitOnboardingResponse = {
    response: string;
  };

  export async function submitOnboardingResponse(
    params: SubmitOnboardingResponse,
  ) {
    const { response: onboardingResponse } = params;
    const currentUserProfile = await UserApi.getCurrentUserProfile();
    if (!currentUserProfile) return;
    await currentUserProfile.save({ onboardingResponse });
  }

  //#endregion MISCELLANEOUS
}
