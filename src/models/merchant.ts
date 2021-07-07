import Parse from 'parse/react-native';
import { EntityId } from '@reduxjs/toolkit';

import { Coordinates, ImageSource, Statistics } from './common';
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
  profileId?: ProfileId;
  avatar?: ImageSource;
  coverPhoto?: ImageSource;
  description?: string;
  coordinates?: Coordinates;
  address?: MerchantAddress;
  statistics?: Statistics;
  __distanceToDefaultPoint?: number;
  /**
   * An internal tag used to check if this particular merchant is a partnered
   * merchant of Discovrr.
   */
  __hasCompleteProfile?: boolean;
}
