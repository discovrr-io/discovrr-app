import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';

import { RouteError } from '../../components';
import { colors, typography, values } from '../../constants';
import { PostId } from '../../models';
import { useAppSelector } from '../../hooks';

import { selectPostById } from './postsSlice';

export default function PostEditScreen() {
  const $FUNC = '[PostEditScreen]';
  const navigation = useNavigation();
  const { postId }: { postId?: PostId } = useRoute().params ?? {};

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  if (!postId) {
    console.error($FUNC, 'No post ID was given');
    return <RouteError />;
  }

  const post = useAppSelector((state) => selectPostById(state, postId));
  if (!post) {
    console.error($FUNC, `Failed to find post with ID '${postId}'`);
    return <RouteError />;
  }

  const handleSaveChanges = async () => {
    if (isSavingChanges) return;
    console.log($FUNC, 'SAVING POST...');
    setIsSavingChanges(true);
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log($FUNC, 'FINISHED SAVING');
          resolve();
        }, 2500);
      });
    } finally {
      setIsSavingChanges(false);
      setHasUnsavedChanges(false); // Set this to true if saving fails
      // navigation.goBack();
    }
  };

  useLayoutEffect(() => {
    console.log($FUNC, 'Setting options...');
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          disabled={isSavingChanges}
          style={{ marginRight: values.spacing.md }}>
          {isSavingChanges ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text
              style={{
                color: colors.accent,
                fontSize: typography.size.md,
                fontWeight: '500',
              }}
              onPress={handleSaveChanges}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isSavingChanges]);

  useEffect(() => {
    navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) return;
      console.log($FUNC, 'SHOWING ALERT...');

      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
          // { text: 'Save Changes', style: 'default' },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    });
  }, [navigation, hasUnsavedChanges]);

  const renderBody = () => {
    switch (post.content.type) {
      case 'image-gallery':
      case 'video':
        return (
          <View style={postEditScreenStyles.container}>
            <Text>(NOT YET IMPLEMENTED)</Text>
          </View>
        );
      case 'text':
      default:
        return (
          <View style={postEditScreenStyles.container}>
            <TextInput
              autoFocus
              multiline
              placeholder="Edit text post..."
              defaultValue={post.content.text}
              onChange={() => {
                if (!hasUnsavedChanges) {
                  console.log($FUNC, 'CHANGED');
                  setHasUnsavedChanges(true);
                }
              }}
              style={[
                postEditScreenStyles.dialogBox,
                postEditScreenStyles.dialogBoxText,
              ]}
            />
          </View>
        );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: values.spacing.md,
        // backgroundColor: 'purple',
        backgroundColor: colors.white,
      }}>
      {renderBody()}
    </ScrollView>
  );
}

const postEditScreenStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    // backgroundColor: 'yellow',
  },
  dialogBox: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md * 1.25,
  },
  dialogBoxText: {
    fontWeight: '500',
    fontSize: typography.size.lg,
    color: colors.black,
  },
});
