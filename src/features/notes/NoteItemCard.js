import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/core';

import { DEFAULT_IMAGE_DIMENSIONS } from '../../constants/media';
import { useAppSelector } from '../../hooks';
import { selectNoteById } from './notesSlice';

import {
  colors,
  typography,
  values,
  DEFAULT_ACTIVE_OPACITY,
} from '../../constants';

/**
 * @typedef {import('../../models').NoteId} NoteId
 * @typedef {{ noteId: NoteId }} NoteItemCardProps
 *
 * @param {NoteItemCardProps & import('react-native').ViewProps} param0
 */
export default function NoteItemCard({ noteId, ...props }) {
  const navigation = useNavigation();

  const note = useAppSelector((state) => selectNoteById(state, noteId));
  if (!note) {
    console.error('[NoteItemCard] Failed to find note with id:', noteId);
    return null;
  }

  const { coverPhoto, title } = note;

  /** @type {number} */
  let coverPhotoWidth;
  /** @type {number} */
  let coverPhotoHeight;

  if (typeof coverPhoto === 'number') {
    coverPhotoWidth = DEFAULT_IMAGE_DIMENSIONS.width;
    coverPhotoHeight = DEFAULT_IMAGE_DIMENSIONS.height;
  } else {
    coverPhotoWidth = coverPhoto.width;
    coverPhotoHeight = coverPhoto.height;
  }

  const handlePressNote = () => {
    navigation.push('NoteDetailScreen', {
      noteId: note.id,
      noteTitle: title || 'Note Details',
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      onPress={handlePressNote}
      style={props.style}>
      <FastImage
        source={coverPhoto}
        style={{
          aspectRatio: coverPhotoWidth / coverPhotoHeight,
          backgroundColor: colors.gray100,
          borderRadius: values.radius.md,
          borderWidth: values.border.thin,
          borderColor: colors.gray300,
        }}
      />
      <Text
        numberOfLines={2}
        style={{
          color: colors.gray700,
          fontWeight: '600',
          fontSize: typography.size.sm,
          paddingVertical: values.spacing.sm,
          paddingHorizontal: values.spacing.sm,
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
