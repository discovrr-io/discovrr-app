import { EntityId } from '@reduxjs/toolkit';

import { Statistics } from './common';
import { MerchantId } from './merchant';

export type ProductId = EntityId & { __productIdBrand: any };

export default interface Product {
  readonly id: ProductId;
  readonly merchantId: MerchantId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly squareSpaceUrl: string;
  readonly imageUrl: string;
  readonly statistics: Statistics;
}
