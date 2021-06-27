import { EntityId } from '@reduxjs/toolkit';

import { GeoPoint, ImageSource } from './common';
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
  geoPoint: GeoPoint;
  profileId?: ProfileId;
  avatar?: ImageSource;
  coverPhoto?: ImageSource;
  address?: MerchantAddress;
}
