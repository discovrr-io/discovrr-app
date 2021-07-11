import { ProfileId } from './profile';

export default interface User {
  provider?: string;
  profileId: ProfileId;
}
