import { MerchantId } from './merchant';
import { ProductId } from './product';

export type NearMeItem =
  | { type: 'merchant'; item: MerchantId }
  | { type: 'product'; item: ProductId };
