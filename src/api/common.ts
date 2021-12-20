import { EntityId, SerializedError } from '@reduxjs/toolkit';
import { Pagination } from 'src/models/common';

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
   * locally.
   *
   * If dealing with a local file on the client side, it may have the `file://`
   * scheme prepended. DO NOT upload this object to the internet if the url path
   * includes the `file://` scheme.
   */
  readonly url: string;
  readonly path?: string;
  readonly filename?: string;
  readonly size?: number;
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
  /** This object is ready to be processed. */
  OKAY = 0,
  /** This object is being processed. Avoid reading or writing to it. */
  PENDING = 1,
  /** @ignore No status associated with this code. */
  __UNUSED = 2,
  /** This object is in an invalid state. */
  ERROR = 3,
  /** This object has been deleted (and may be scheduled to be removed). */
  DELETED = 9,
}

export type Reloadable<P> = P & { reload?: boolean };
export type Paginated<P> = P & { pagination: Pagination };
