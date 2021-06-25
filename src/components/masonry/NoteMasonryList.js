import React from 'react';

import MasonryList from './MasonryList';
import NoteItemCard from '../../features/notes/NoteItemCard';
import { values } from '../../constants';

/**
 * @typedef {import('./MasonryList').MasonryListProps<NoteId>} MasonryListProps
 * @typedef {Omit<MasonryListProps, 'data' | 'renderItem'>} RestProps
 *
 * @typedef {import('../../models').NoteId} NoteId
 * @typedef {{ noteIds: NoteId[], tileSpacing?: number }} NoteMasonryListProps
 *
 * @param {NoteMasonryListProps & RestProps} param0
 * @returns
 */
export default function NoteMasonryList({
  noteIds,
  tileSpacing = values.spacing.sm * 1.25,
  smallContent,
  ...props
}) {
  return (
    <MasonryList
      {...props}
      data={noteIds}
      renderItem={({ item: noteId, index }) => (
        <NoteItemCard
          noteId={noteId}
          style={{
            marginTop: tileSpacing,
            marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
            marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
            marginBottom: values.spacing.sm,
          }}
        />
      )}
    />
  );
}
