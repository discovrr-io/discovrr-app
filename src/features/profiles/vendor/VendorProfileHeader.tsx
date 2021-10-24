import React from 'react';

import ProfileHeader from '../ProfileHeader';
import { VendorProfile } from 'src/models/profile';

type VendorProfileHeaderProps = {
  vendorProfile: VendorProfile;
};

export default function VendorProfileHeader(props: VendorProfileHeaderProps) {
  const vendorProfile = props.vendorProfile;
  return (
    <ProfileHeader
      profileDetails={{
        ...vendorProfile,
        displayName: vendorProfile.businessName || vendorProfile.displayName,
      }}
    />
  );
}
