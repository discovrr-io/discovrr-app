import React from 'react';
import { Text, View } from 'react-native';
import { VendorProfile } from 'src/models/profile';

type VendorProfileHeaderProps = {
  vendorProfile: VendorProfile;
};

export default function VendorProfileHeader(props: VendorProfileHeaderProps) {
  return (
    <View>
      <Text>{JSON.stringify(props.vendorProfile)}</Text>
    </View>
  );
}
