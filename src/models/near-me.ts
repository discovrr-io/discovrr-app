import { ProfileId } from './profile';
import { ProductId } from './product';

export type NearMeItem =
  | { type: 'profile'; item: ProfileId }
  | { type: 'product'; item: ProductId };
