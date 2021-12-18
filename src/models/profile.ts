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
  readonly biography?: string;
  readonly highestRole: string;

  /**
   * An object representing information about the avatar of this profile.
   *
   * This property may be set to `null` if the user wishes the explicitly remove
   * their current profile avatar. It will be translated to `undefined` in the
   * database.
   */
  readonly avatar?: MediaSource | null;

  /**
   * An object representing information about the background of this profile.
   *
   * Just like `avatar`, this property may be set to `null` if the user wishes
   * to remove their current background.
   */
  readonly background?: MediaSource | null;
  readonly backgroundThumbnail?: MediaSource | null;

  readonly followers: ProfileId[];
  readonly following: ProfileId[];
  readonly blocked: ProfileId[];

  readonly didCompleteMainOnboarding: boolean;
}

/**
 * Properties that are present in personal and vendor profiles, but are not
 * shared. These properties are simply duplicated between personal and vendor
 * profiles and are not meant to be shared.
 */
export interface CommonProfileDetails<Id extends EntityId> {
  readonly id: Id;
  readonly profileId: ProfileId;
  readonly status: ApiObjectStatus;
}

export interface PersonalProfile
  extends CommonProfileDetails<PersonalProfileId>,
    SharedProfileDetails {}

export type VendorProfileAddress = {
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
  readonly businessAddress?: VendorProfileAddress;
  readonly coordinates?: Coordinates;
  readonly statistics?: Statistics;
}

interface ProfilePublicName {
  /**
   * Returns the appropriate public name of the profile (either the business
   * name of a vendor, if available, otherwise the display name).
   *
   * This property will not do anything special in the case that both strings
   * are falsy (i.e. they are both empty strings).
   */
  readonly __publicName: string;
}

type PersonalOrVendorProfile =
  | ({ kind: 'personal' } & PersonalProfile)
  | ({ kind: 'vendor' } & VendorProfile);

/**
 * A union of `PersonalProfile` and `VendorProfile` distinguished by the `kind`
 * property.
 */
type Profile = ProfilePublicName & PersonalOrVendorProfile;

export type ProfileKind = Profile['kind'];

export default Profile;
