import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { EmptyTabView, ErrorTabView, MasonryList } from '../../components';
import {
  colors,
  typography,
  values,
  DEFAULT_ACTIVE_OPACITY,
} from '../../constants';

import NoteItemCard from './NoteItemCard';
import { fetchNotesForCurrentUser, selectNoteIds } from './notesSlice';

function CreateNewNoteButton() {
  return (
    <TouchableOpacity
      onPress={() => {}}
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      style={{ padding: values.spacing.md, paddingBottom: values.spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: values.spacing.md,
          borderColor: colors.gray200,
          borderBottomWidth: values.border.thin,
        }}>
        <Icon
          name="add"
          size={32}
          color={colors.black}
          style={{ marginRight: values.spacing.md }}
        />
        <Text style={{ fontSize: typography.size.lg }}>Create New Note</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotesScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const noteIds = useSelector(selectNoteIds);

  /** @type {import('../../api').ApiFetchStatus */
  const { error: fetchError } = useSelector((state) => state.notes);

  const [shouldRefresh, setShouldRefresh] = useState(true);

  useEffect(() => {
    const refreshNotes = async () => {
      try {
        console.log('Refreshing notes...');
        await dispatch(fetchNotesForCurrentUser()).unwrap();
      } catch (error) {
        console.error('[MyNotesScreen] Failed to refresh notes:', error);
        Alert.alert(
          'Something wrong happened',
          "We couldn't refresh your notes for you",
        );
      } finally {
        setShouldRefresh(false);
      }
    };

    if (shouldRefresh) refreshNotes();
  }, [shouldRefresh, dispatch]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const TILE_SPACING = values.spacing.sm * 1.25;

  return (
    <MasonryList
      data={noteIds}
      ListHeaderComponent={<CreateNewNoteButton />}
      ListEmptyComponent={
        fetchError ? (
          <ErrorTabView error={fetchError} />
        ) : (
          <EmptyTabView message="Looks like you don't have any notes yet" />
        )
      }
      refreshControl={
        <RefreshControl
          tintColor={colors.gray500}
          refreshing={shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
      renderItem={({ item: noteId, index }) => (
        <NoteItemCard
          noteId={noteId}
          style={{
            marginTop: TILE_SPACING,
            marginLeft: index % 2 === 0 ? TILE_SPACING : TILE_SPACING / 2,
            marginRight: index % 2 !== 0 ? TILE_SPACING : TILE_SPACING / 2,
            marginBottom: values.spacing.sm,
          }}
        />
      )}
    />
  );
}
