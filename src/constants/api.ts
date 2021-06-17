import { SerializedError } from '@reduxjs/toolkit';

export type FetchLoadingStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

export type FetchStatus = {
  status: FetchLoadingStatus;
  error?: SerializedError;
};
