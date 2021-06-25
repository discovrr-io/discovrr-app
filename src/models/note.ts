import { EntityId } from '@reduxjs/toolkit';

import { ImageSource } from './common';
import { PostId } from './post';
import { ProfileId } from './profile';

export type NoteId = EntityId;

export default interface Note {
  id: NoteId;
  title: string;
  isPrivate: boolean;
  coverPhoto: ImageSource;
  profile: ProfileId;
  posts: PostId[];
}
