import { EntityId } from '@reduxjs/toolkit';

import { MediaSource } from 'src/api';
import { Coordinates, Statistics } from './common';
import { ProfileId } from './profile';

export type MerchantId = EntityId & { __merchantBrandId: any };

export type MerchantAddress = {
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly street?: string;
  readonly city?: string;
  readonly postCode?: string;
  readonly state?: string;
  readonly country?: string;
};

export default interface Merchant {
  readonly id: MerchantId;
  readonly shortName: string;
  readonly profileId?: ProfileId;
  readonly avatar?: MediaSource;
  readonly coverPhoto?: MediaSource;
  readonly biography?: string;
  readonly coordinates?: Coordinates;
  readonly address?: MerchantAddress;
  readonly statistics?: Statistics;
  // readonly __distanceToDefaultPoint?: number;
  // /**
  //  * An internal tag used to check if this particular merchant is a partnered
  //  * merchant of Discovrr.
  //  */
  // readonly __hasCompleteProfile?: boolean;
}
