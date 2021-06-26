import Parse from 'parse/react-native';

import { Note } from '../models';
import { ImageSource } from '../models/common';
import { DEFAULT_IMAGE, DEFAULT_IMAGE_DIMENSIONS } from '../constants/media';
import { MediaSource } from '.';

export namespace NoteApi {
  export async function fetchNotesForCurrentUser(): Promise<Note[]> {
    try {
      console.group('NoteApi.fetchNotesForCurrentUser');
      const currentUser = await Parse.User.currentAsync();
      const notesQuery = new Parse.Query(Parse.Object.extend('Board'));
      notesQuery.equalTo('owner', currentUser);

      const results = await notesQuery.find();
      console.log(`Found ${results.length} note(s) for current profile`);

      const notes = results.map((note) => {
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
          id: note.id,
          title: note.get('title') ?? 'Untitled',
          isPrivate: note.get('isPrivate') ?? true,
          coverPhoto,
          profileId: note.get('profile').id,
          posts: note.get('postsArray') ?? [],
        } as Note;
      });

      return notes;
    } catch (error) {
      console.error('Failed to fetch notes for current user:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
}
