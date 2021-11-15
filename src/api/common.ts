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
  readonly status: LoadingStatus;
  readonly error?: SerializedError;
};

export type ApiFetchStatuses<Id extends EntityId = string> = {
  readonly statuses: Record<Id, ApiFetchStatus>;
};

// TODO: Distinguish between external and local media sources
export type MediaSource = {
  readonly mime: string;
  /**
   * The location of the media source, which may reside on the internet or
   * locally. If a local file, it may have the `file://` scheme prepended.
   */
  readonly url: string;
  readonly path?: string;
  readonly filename?: string;
  readonly size?: number;
  readonly type?: string;
  readonly width?: number;
  readonly height?: number;
  /**
   * Duration in milliseconds.
   *
   * Only available for videos.
   */
  readonly duration?: number | null;
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
