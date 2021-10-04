import Parse from 'parse/react-native';

import { DEFAULT_IMAGE, DEFAULT_IMAGE_DIMENSIONS } from 'src/constants/media';
import { Note, NoteId } from 'src/models';
import { ImageSource } from 'src/models/common';

import { UserApi } from '.';
import { MediaSource } from './common';

export namespace NoteApi {
  export async function fetchNotesForCurrentUser(): Promise<Note[]> {
    const $FUNC = '[NoteApi.fetchNotesForCurrentUser]';

    const myProfile = await UserApi.getCurrentUserProfile();
    if (!myProfile) throw new UserApi.UserNotFoundApiError();

    const notesQuery = new Parse.Query(Parse.Object.extend('Board'));
    notesQuery.equalTo('profile', myProfile.toPointer());

    const results = await notesQuery.find();
    console.log($FUNC, `Found ${results.length} note(s) for current profile`);

    const notes = results.map(note => {
      const image: MediaSource | undefined = note.get('image');
      let coverPhoto: ImageSource;
      if (image) {
        coverPhoto = {
          uri: image.url,
          width: image.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
          height: image.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
        };
      } else {
        coverPhoto = DEFAULT_IMAGE;
      }

      return {
        id: note.id as NoteId,
        title: note.get('title') ?? 'Untitled',
        isPublic: !(note.get('isPrivate') ?? false),
        coverPhoto,
        profileId: note.get('profile').id,
        posts: note.get('postsArray') ?? [],
      };
    });

    return notes;
  }
}
