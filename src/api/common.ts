import { EntityId, SerializedError } from '@reduxjs/toolkit';

export type CommonApiErrorCode =
  | 'PARSE_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR'
  | 'UNIMPLEMENTED';

export class ApiError<
  ApiErrorCode extends string = CommonApiErrorCode,
> extends Error {
  constructor(public readonly code: ApiErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * The current loading status of an async request.
 *
 * TODO: Do we need the `"idle"` state? We can just default to `"pending"` for
 * all initial states.
 */
export type LoadingStatus =
  | 'idle'
  | 'pending'
  | 'refreshing'
  | 'fulfilled'
  | 'rejected';

/**
 * Used by Redux to indicate the current status of an async request to the Parse
 * server. Only the `status` field is required.
 */
export type ApiFetchStatus = {
  status: LoadingStatus;
  error?: SerializedError;
};

export type ApiFetchStatuses<Id extends EntityId = string> = {
  statuses: Record<Id, ApiFetchStatus>;
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

/**
 * Describes the current status of an object for any class that has a `status`
 * column.
 *
 * NOTE: Keep this in sync with the backend.
 */
export enum ApiObjectStatus {
  /** This object is ready for tasks. */
  READY = 0,
  /** This object is in the middle of a task. */
  PENDING = 1,
  /** This object has completed a task. */
  FULFILLED = 2,
  /** This object failed to complete a task. */
  ERROR = 3,
  /** This object is deleted (and may be scheduled to be removed). */
  DELETED = 9,
}

export type Reloadable<T> = T & { reload?: boolean };
