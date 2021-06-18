import { EntityId } from '@reduxjs/toolkit';

import { PostId } from './post';
import { ProfileId } from './profile';

export type CommentId = EntityId;

export default interface Comment {
  id: CommentId;
  postId: PostId;
  profileId: ProfileId;
  createdAt: string;
  message: string;
}
