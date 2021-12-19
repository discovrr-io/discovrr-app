import Parse from 'parse/react-native';
import { EntityId } from '@reduxjs/toolkit';

import { Profile, ProfileId } from 'src/models';
import { Pagination } from 'src/models/common';

import {
  CommonProfileDetails,
  PersonalProfile,
  PersonalProfileId,
  ProfileKind,
  SharedProfileDetails,
  VendorProfile,
  VendorProfileId,
} from 'src/models/profile';

import { ApiError, ApiObjectStatus, CommonApiErrorCode } from './common';

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
      status: object.get('status') ?? ApiObjectStatus.OKAY,
    };
  }

  export function mapResultToProfile(result: Parse.Object): Profile {
    const sharedProfileDetails: SharedProfileDetails = {
      email: result.get('email') ?? '',
      username: result.get('username') ?? '',
      displayName: result.get('displayName') ?? '',
      biography: result.get('biography'),
      avatar: result.get('avatar'),
      background: result.get('background'),
      backgroundThumbnail: result.get('backgroundThumbnail'),
      // TODO: Compute this through a query instead
      followers: result.get('followersArray') ?? [],
      following: result.get('followingArray') ?? [],
      blocked: result.get('blockedArray') ?? [],
      highestRole: result.get('highestRole'),
      didSetUpProfile: result.get('didSetUpProfile') ?? false,
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

      return {
        kind: 'personal',
        ...commonProfileDetails,
        ...sharedProfileDetails,
        __publicName: sharedProfileDetails.displayName,
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

      const foundBusinessName: string | undefined = result
        .get('profileVendor')
        ?.get('businessName');

      return {
        kind: 'vendor',
        ...commonProfileDetails,
        ...sharedProfileDetails,
        businessName: foundBusinessName,
        businessEmail: result.get('profileVendor')?.get('businessEmail'),
        businessAddress: result.get('profileVendor')?.get('businessAddress'),
        __publicName: foundBusinessName || sharedProfileDetails.displayName,
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

  export type FetchProfileByUsernameParams = {
    username: string;
  };

  export async function fetchProfileByUsername(
    params: FetchProfileByUsernameParams,
  ): Promise<Profile> {
    const { username } = params;
    const query = new Parse.Query(Parse.Object.extend('Profile'));

    const result = await query
      .include('profilePersonal', 'profileVendor')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .equalTo('username', username)
      .first();

    if (!result) {
      throw new Error(`No profile was found with username '${username}'`);
    }

    return mapResultToProfile(result);
  }

  export type FetchProfileByEmailParams = {
    email: string;
  };

  export async function fetchProfileByEmail(
    params: FetchProfileByEmailParams,
  ): Promise<Profile> {
    const { email } = params;
    const query = new Parse.Query(Parse.Object.extend('Profile'));

    const result = await query
      .include('profilePersonal', 'profileVendor')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .equalTo('email', email)
      .first();

    if (!result) {
      throw new Error(`No profile was found with username '${email}'`);
    }

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

    const results = await query.find();
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
      query.skip(pagination.currentPage * pagination.limit);
    }

    const results = await query.find();
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
    return mapResultToProfile(profile);
  }

  export async function fetchAllVerifiedVendors() {
    const vendorsQuery = new Parse.Query(Parse.Object.extend('Profile'));

    const vendors = await vendorsQuery
      .include('profilePersonal', 'profileVendor')
      .equalTo('kind', 'vendor')
      .notEqualTo('profileVendor', null)
      .find();

    return (
      vendors
        // We have to filter after querying since this field is populated in the
        // `afterFind` trigger
        .filter(vendor => vendor.get('highestRole') === 'verified-vendor')
        .map(mapResultToProfile)
        .slice()
        .sort((a, b) => a.__publicName.localeCompare(b.__publicName))
    );
  }

  //#endregion READ OPERATIONS

  //#region UPDATE OPERATIONS

  type SharedProfileChanges = Partial<
    Pick<SharedProfileDetails, 'displayName' | 'username' | 'biography'>
  >;

  type PersonalProfileChanges = Partial<Pick<PersonalProfile, never>>;

  type VendorProfileChanges = Partial<
    Pick<VendorProfile, 'businessName' | 'businessEmail' | 'businessAddress'>
  >;

  export type ProfileChanges = SharedProfileChanges &
    PersonalProfileChanges &
    VendorProfileChanges & {
      avatar?: Profile['avatar'] | null;
      background?: Profile['background'] | null;
      backgroundThumbnail?: Profile['backgroundThumbnail'] | null;
    };

  export type UpdateProfileParams = {
    profileId: ProfileId;
    changes: ProfileChanges;
  };

  export async function updateProfile(params: UpdateProfileParams) {
    const updatedProfile = await Parse.Cloud.run('updateProfile', params);
    return mapResultToProfile(updatedProfile);
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
}
