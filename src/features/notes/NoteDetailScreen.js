import React from 'react';
// import { Text, View } from 'react-native';

import { useRoute } from '@react-navigation/native';

import PostMasonryList from '../../components/masonry/PostMasonryList';
import { EmptyTabView, RouteError } from '../../components';
import { useAppSelector } from '../../hooks';
import { selectNoteById } from './notesSlice';

export default function NoteDetailScreen() {
  const { noteId } = useRoute().params;
  if (!noteId) {
    console.error('[PostDetailScreen] No post ID was given');
    return <RouteError />;
  }

  const note = useAppSelector((state) => selectNoteById(state, noteId));
  if (!note) {
    console.error('[PostDetailScreen] Failed to find post with id:', noteId);
    return <RouteError />;
  }

  return (
    <PostMasonryList
      smallContent
      postIds={note.posts}
      ListEmptyComponent={
        <EmptyTabView message="You haven't saved anything in this note" />
      }
    />
  );
}
