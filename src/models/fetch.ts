import { SerializedError } from '@reduxjs/toolkit';

export type FetchLoadingStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

export default interface FetchStatus {
  status: FetchLoadingStatus;
  error?: SerializedError;
}
