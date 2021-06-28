import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { useRoute } from '@react-navigation/native';

import { ProfileScreenHeader } from '../profiles/ProfileScreen';

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @typedef {{ merchant: Merchant }} MerchantProfileScreenProps
 * @param {MerchantProfileScreenProps} param0
 */
export default function MerchantProfileScreen() {
  /** @type {{ merchant: Merchant }} */
  const { merchant } = useRoute().params ?? {};

  // const profileDetails = {}

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ProfileScreenHeader
        profileDetails={{
          ...merchant,
          fullName: merchant.shortName,
          isVendor: true,
        }}
      />
      <Text>MERCHANT: {JSON.stringify(merchant)}</Text>
    </SafeAreaView>
  );
}
