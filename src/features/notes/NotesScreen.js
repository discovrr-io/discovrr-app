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

import NoteMasonryList from '../../components/masonry/NoteMasonryList';
import { EmptyTabView, ErrorTabView } from '../../components';
import { FEATURE_UNAVAILABLE } from '../../constants/strings';
import { fetchNotesForCurrentUser, selectNoteIds } from './notesSlice';

import {
  colors,
  typography,
  values,
  DEFAULT_ACTIVE_OPACITY,
} from '../../constants';

function CreateNewNoteButton() {
  return (
    <TouchableOpacity
      onPress={() => {
        Alert.alert(FEATURE_UNAVAILABLE.title, FEATURE_UNAVAILABLE.message);
      }}
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
        console.error('[NotesScreen] Failed to refresh notes:', error);
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

  return (
    <NoteMasonryList
      noteIds={noteIds}
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
    />
  );
}
