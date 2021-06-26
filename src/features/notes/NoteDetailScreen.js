import React from 'react';
import { Text, View } from 'react-native';

import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import PostMasonryList from '../../components/masonry/PostMasonryList';
import { EmptyTabView, RouteError } from '../../components';
import { selectNoteById } from './notesSlice';

export default function NoteDetailScreen() {
  const { noteId } = useRoute().params;
  if (!noteId) {
    console.error('[PostDetailScreen] No post ID was given');
    return <RouteError />;
  }

  const note = useSelector((state) => selectNoteById(state, noteId));
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
