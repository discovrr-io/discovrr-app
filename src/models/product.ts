import { EntityId } from '@reduxjs/toolkit';
import { MediaSource } from 'src/api';

import { Statistics } from './common';
import { VendorProfileId } from './profile';

export type ProductId = EntityId & { __productIdBrand: any };

export default interface Product {
  readonly id: ProductId;
  readonly vendorId: VendorProfileId;
  readonly squarespaceId?: string;
  readonly squarespaceUrl?: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly media: MediaSource[];
  readonly hidden: boolean;
  readonly statistics: Statistics;
}
