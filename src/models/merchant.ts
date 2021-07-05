import Parse from 'parse/react-native';
import { EntityId } from '@reduxjs/toolkit';

import { ImageSource } from './common';
import { ProfileId } from './profile';

export type MerchantId = EntityId;

export type MerchantAddress = {
  addressLine1?: string;
  addressLine2?: string;
  street?: string;
  city?: string;
  postCode?: string;
  state?: string;
  country?: string;
};

export default interface Merchant {
  id: MerchantId;
  shortName: string;
  geoPoint: Parse.GeoPoint;
  profileId?: ProfileId;
  avatar?: ImageSource;
  coverPhoto?: ImageSource;
  description?: string;
  address?: MerchantAddress;
  /**
   * An internal tag used to check if this particular merchant is a partnered
   * merchant of Discovrr.
   */
  __hasCompleteProfile?: boolean;
}
