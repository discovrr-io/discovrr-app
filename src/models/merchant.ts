import { EntityId } from '@reduxjs/toolkit';
import { ImageSource } from './common';
import { ProfileId } from './profile';

export type MerchantId = EntityId;

export default interface Merchant {
  id: MerchantId;
  shortName: string;
  profileId?: ProfileId;
  // coverPhoto?: ImageSource;
}
