import { SerializedError } from '@reduxjs/toolkit';

/**
 * The current loading status of an async request to the Parse server.
 */
export type LoadingStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

/**
 * Used by Redux to indicate the current status of an async request to the Parse
 * server. Only the `status` field is required.
 */
export type ApiFetchStatus = {
  status: LoadingStatus;
  error?: SerializedError;
};

export type MediaSource = {
  mime: string;
  url: string;
  path?: string;
  size?: number;
  type?: string;
  width?: number;
  height?: number;
  filename?: string;
};

export { AuthApi } from './auth';
export { CommentApi } from './comment';
export { MerchantApi } from './merchant';
export { NoteApi } from './note';
export { PostApi } from './post';
export { ProfileApi } from './profile';
