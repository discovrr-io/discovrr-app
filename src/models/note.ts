import { EntityId } from '@reduxjs/toolkit';

import { ImageSource } from './common';
import { PostId } from './post';
import { ProfileId } from './profile';

export type NoteId = EntityId & { __noteIdBrand: any };

export default interface Note {
  readonly id: NoteId;
  readonly title: string;
  readonly isPublic: boolean;
  readonly coverPhoto: ImageSource;
  readonly profileId: ProfileId;
  readonly posts: PostId[];
}
