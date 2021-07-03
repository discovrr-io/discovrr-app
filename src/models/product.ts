import { EntityId } from '@reduxjs/toolkit';

import { MerchantId } from './merchant';

export type ProductId = EntityId;

export default interface Product {
  id: ProductId;
  merchantId: MerchantId;
  name: string;
  description: string;
  price: number;
  squareSpaceUrl: string;
  imageUrl: string;
}
