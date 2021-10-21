import { EntityId } from '@reduxjs/toolkit';
import { ApiObjectStatus, MediaSource } from 'src/api';
import { Coordinates, Statistics } from './common';

export type ProfileId = EntityId & { __profileIdBrand: any };
export type PersonalProfileId = EntityId & { __personalProfileIdBrand: any };
export type VendorProfileId = EntityId & { __vendorProfileIdBrand: any };

/**
 * Properties shared between personal and vendor profiles. These properties are
 * found in the root `Profile` object in the database.
 */
export interface SharedProfileDetails {
  readonly email: string;
  readonly username: string;
  readonly displayName: string;
  readonly followers?: ProfileId[];
  readonly following?: ProfileId[];
  readonly blocked?: ProfileId[];
}

/**
 * Properties that are present in personal and vendor profiles, but are not
 * shared. These properties are simply duplicated between personal and vendor
 * profiles but represent two different things.
 */
export interface CommonProfileDetails<Id extends EntityId> {
  readonly id: Id;
  readonly profileId: ProfileId;
  readonly status: ApiObjectStatus;
  readonly avatar?: MediaSource;
  readonly coverPhoto?: MediaSource;
  readonly biography?: string;
}

export interface PersonalProfile
  extends CommonProfileDetails<PersonalProfileId>,
    SharedProfileDetails {}

type VendorProfileAddress = {
  readonly street?: string;
  readonly city?: string;
  readonly postcode?: string;
  readonly state?: string;
  readonly country?: string;
};

export interface VendorProfile
  extends CommonProfileDetails<VendorProfileId>,
    SharedProfileDetails {
  readonly businessName?: string;
  readonly businessEmail?: string;
  readonly address?: VendorProfileAddress;
  readonly coordinates?: Coordinates;
  readonly statistics?: Statistics;
}

/**
 * A union of `PersonalProfile` and `VendorProfile` distinguished by the `kind`
 * property.
 */
type Profile =
  | ({ kind: 'personal' } & PersonalProfile)
  | ({ kind: 'vendor' } & VendorProfile);

export type ProfileKind = Profile['kind'];

export default Profile;
