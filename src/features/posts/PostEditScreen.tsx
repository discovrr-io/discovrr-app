import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import {
  useAppDispatch,
  useAppSelector,
  useIsInitialRender,
} from '../../hooks';

import { selectPostById, updatePostTextContent } from './postsSlice';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';

const MIN_TEXT_POST_CHAR_COUNT = 10;

export default function PostEditScreen() {
  const $FUNC = '[PostEditScreen]';
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const { postId }: { postId?: PostId } = useRoute().params ?? {};

  if (!postId) {
    console.error($FUNC, 'No post ID was given');
    return <RouteError />;
  }

  const post = useAppSelector((state) => selectPostById(state, postId));
  if (!post) {
    console.error($FUNC, `Failed to find post with ID '${postId}'`);
    return <RouteError />;
  }

  const originalPostTextContent = useMemo(() => {
    if (
      post.content.type === 'image-gallery' ||
      post.content.type === 'video'
    ) {
      return post.content.caption;
    } else {
      return post.content.text;
    }
  }, [post]);

  const [editedTextContent, setEditedTextContent] = useState(
    originalPostTextContent,
  );

  // const isInitialRender = useIsInitialRender();
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [didSaveChanges, setDidSaveChanges] = useState(false);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);

  const handleSaveChanges = async (newText: string) => {
    if (isSavingChanges) return;

    try {
      setIsSavingChanges(true);
      await dispatch(updatePostTextContent({ postId, text: newText }));
      setDidSaveChanges(true);
      setShouldNavigateBack(true);
    } catch (error) {
      console.error($FUNC, 'Failed to edit post:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "We couldn't save your changes right now. Please try again later.",
      );
    } finally {
      setIsSavingChanges(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const disabled =
          isSavingChanges ||
          editedTextContent.length < MIN_TEXT_POST_CHAR_COUNT;

        return (
          <TouchableOpacity
            disabled={disabled}
            style={{ marginRight: values.spacing.lg }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={() => handleSaveChanges(editedTextContent)}>
            {isSavingChanges ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text
                style={{
                  color: disabled ? colors.gray500 : colors.accent,
                  fontSize: typography.size.md,
                  fontWeight: '500',
                }}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        );
      },
    });
  }, [navigation, isSavingChanges, editedTextContent]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const didNotChange = editedTextContent.trim() === originalPostTextContent;
      console.log($FUNC, { didSaveChanges, didNotChange });

      if (didSaveChanges || didNotChange) return;
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

    return unsubscribe;
  }, [navigation, didSaveChanges, editedTextContent]);

  useEffect(() => {
    if (shouldNavigateBack) navigation.goBack();
  }, [shouldNavigateBack]);

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
              editable={!isSavingChanges}
              placeholder="What's on your mind?"
              defaultValue={originalPostTextContent}
              value={editedTextContent}
              onChangeText={setEditedTextContent}
              style={[
                postEditScreenStyles.dialogBox,
                postEditScreenStyles.dialogBoxText,
              ]}
            />
            <Text
              style={{
                color: colors.gray500,
                fontSize: typography.size.sm,
                marginTop: values.spacing.md,
              }}>
              Note: Your post must have at least {MIN_TEXT_POST_CHAR_COUNT}{' '}
              characters
            </Text>
          </View>
        );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: values.spacing.md,
        backgroundColor: colors.white,
      }}>
      <KeyboardAvoidingView>{renderBody()}</KeyboardAvoidingView>
    </ScrollView>
  );
}

const postEditScreenStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
