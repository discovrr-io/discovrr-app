import { EntityId } from '@reduxjs/toolkit';

import { MerchantId } from './merchant';

export type ProductId = EntityId;

export default interface Product {
  id: ProductId;
  merchant: MerchantId;
  name: string;
  price: number;
  squareSpaceUrl: string;
  imageUrl: string;
}
