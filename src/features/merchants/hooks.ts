import { TypedUseAsyncItem, useAsyncItem } from 'src/hooks';
import { Merchant, MerchantId } from 'src/models';
import {
  fetchMerchantById,
  selectMerchantById,
  selectMerchantStatusById,
} from './merchants-slice';

export const useMerchant: TypedUseAsyncItem<MerchantId, Merchant | undefined> =
  merchantId => {
    return useAsyncItem(
      'merchant',
      merchantId,
      fetchMerchantById({ merchantId }), // We won't reload by default
      selectMerchantById,
      selectMerchantStatusById,
    );
  };
