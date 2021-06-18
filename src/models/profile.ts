import { EntityId } from '@reduxjs/toolkit';
import { ImageSource } from './common';

/**
 * The unique identifier type of a given profile.
 */
export type ProfileId = EntityId;

/**
 * An interface describing the structure of a profile object.
 */
export default interface Profile {
  id: ProfileId;
  email: string;
  fullName: string;
  username: string;
  isVendor: boolean;
  avatar?: ImageSource;
  coverPhoto?: ImageSource;
  description?: string;
  oneSignalPlayerIds?: string[];
}
