import Parse from 'parse/react-native';
import { ProfileId, VendorProfile, VendorProfileId } from 'src/models/profile';

import { ApiError, CommonApiErrorCode, UserApi } from '.';

export namespace VendorApi {
  export type VendorApiErrorCode = CommonApiErrorCode | 'VENDOR_NOT_FOUND';
  export class VendorApiError extends ApiError<VendorApiErrorCode> {}

  function mapResultToVendorProfile(
    result: Parse.Object,
    _myProfileId?: string,
  ): VendorProfile {
    const vendorProfile: Parse.Object = result.get('vendorProfile');
    return {
      id: vendorProfile.id as VendorProfileId,
      profileId: result.id as ProfileId,
      email: result.get('email'),
      displayName: result.get('displayName'),
      username: result.get('username'),
      biography: vendorProfile.get('biography'),
      businessName: vendorProfile.get('businessName'),
      businessEmail: vendorProfile.get('businessName'),
      address: vendorProfile.get('address'),
      status: vendorProfile.get('status'),
    };
  }

  //#region READ OPERATIONS

  export type FetchVendorProfileByIdParams = {
    vendorProfileId: VendorProfileId;
  };

  export async function fetchVendorProfileById(
    params: FetchVendorProfileByIdParams,
  ) {
    const { vendorProfileId } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const vendorProfileQuery = new Parse.Query('VendorProfile');

    const result = await vendorProfileQuery.get(String(vendorProfileId));
    return mapResultToVendorProfile(result, myProfile?.id);
  }

  //#endregion READ OPERATIONS
}
