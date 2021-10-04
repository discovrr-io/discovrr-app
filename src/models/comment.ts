import { EntityId } from '@reduxjs/toolkit';

import { PostId, ProfileId } from '.';
import { Statistics } from './common';

/**
 * The type of a unique identifier for a given comment.
 */
export type CommentId = EntityId & { __commentIdBrand: any };

/**
 * The type of a unique identifier for a given comment reply.
 */
export type CommentReplyId = EntityId & { __commentReplyIdBrand: any };

export default interface Comment {
  readonly id: CommentId;
  readonly postId: PostId;
  readonly profileId: ProfileId;
  readonly createdAt: string;
  readonly message: string;
  readonly statistics: Statistics;
  readonly replies?: CommentReplyId[];
}

export interface CommentReply {
  readonly id: CommentReplyId;
  readonly parent: CommentId;
  readonly profileId: ProfileId;
  readonly createdAt: string;
  readonly message: string;
  readonly statistics: Statistics;
}
