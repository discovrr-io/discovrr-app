import { EntityId } from '@reduxjs/toolkit';
import { ApiObjectStatus, MediaSource } from 'src/api';

/**
 * The unique identifier type of a given profile.
 */
export type ProfileId = EntityId & { __profileIdBrand: any };

export type ProfileKind = 'personal' | 'vendor';

/**
 * An interface describing the structure of a profile object.
 */
export default interface Profile {
  readonly id: ProfileId;
  readonly kind: ProfileKind;
  readonly email: string;
  readonly displayName: string;
  readonly username: string;
  readonly biography?: string;
  readonly avatar?: MediaSource;
  readonly coverPhoto?: MediaSource;
  readonly followers?: ProfileId[];
  readonly following?: ProfileId[];
  readonly blocked?: ProfileId[];
  readonly status: ApiObjectStatus;
}
