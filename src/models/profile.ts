import { EntityId } from '@reduxjs/toolkit';
import { MediaSource } from 'src/api';

/**
 * The unique identifier type of a given profile.
 */
export type ProfileId = EntityId & { __profileIdBrand: any };

/**
 * An interface describing the structure of a profile object.
 */
export default interface Profile {
  readonly id: ProfileId;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly isVendor: boolean;
  readonly avatar?: MediaSource;
  readonly coverPhoto?: MediaSource;
  /** @deprecated Use `biography` instead */
  readonly description?: string;
  readonly biography?: string;
  readonly followers?: ProfileId[];
  readonly following?: ProfileId[];
}
