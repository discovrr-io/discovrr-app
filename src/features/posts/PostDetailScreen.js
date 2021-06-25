import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { useRoute } from '@react-navigation/core';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import {
  EmptyTabView,
  ErrorTabView,
  RouteError,
  LoadingTabView,
} from '../../components';
import PostComment from '../comments/PostComment';
import { PostItemFooter } from '../../components/PostItem';
import { colors, typography, values } from '../../constants';
import {
  addCommentForPost,
  selectAllComments,
} from '../comments/commentsSlice';
import { fetchPostById, selectPostById } from './postsSlice';

const Parse = require('parse/react-native');

const COMMENT_TEXT_INPUT_HEIGHT = 50;
const COMMENT_POST_BUTTON_WIDTH = 70;

const getCommentsForPost = createSelector(
  [selectPostById, selectAllComments],
  /**
   * @returns {import('../../models').CommentId[]}
   */
  (post, allComments) => {
    if (post) {
      return allComments
        .filter((comment) => comment.postId === post.id)
        .map((comment) => comment.id);
    } else {
      return [];
    }
  },
);

/**
 * @typedef {import('../../models').Comment} Comment
 * @param {string} postId
 * @returns {Promise<Comment[]>}
 */
async function fetchCommentsForPost(postId) {
  const postPointer = {
    __type: 'Pointer',
    className: 'Post',
    objectId: postId,
  };

  const query = new Parse.Query(Parse.Object.extend('PostComment'));
  query.equalTo('post', postPointer);
  query.include('profile');

  const results = await query.find();
  const comments = results.map((comment) => {
    return {
      id: comment.id,
      postId: comment.get('post').id,
      profileId: comment.get('profile').id,
      createdAt: comment.createdAt,
      message: comment.get('message') ?? '',
    };
  });

  return comments;
}

/**
 * @typedef {import('../../models/common').ImageSource} ImageSource
 * @typedef {{ item: ImageSource }} SliderImageProps
 * @param {SliderImageProps} param0
 */
function SliderImage({ item: source }) {
  if (source.type === 'video') {
    <Video
      paused
      allowsExternalPlayback={false}
      resizeMode="cover"
      source={source}
      style={{
        // FIXME: source may be number
        aspectRatio: source.width / source.height,
        borderRadius: values.radius.md,
      }}
    />;
  } else {
    return (
      <FastImage
        style={{
          // FIXME: source may be number
          aspectRatio: source.width / source.height,
          borderRadius: values.radius.md,
        }}
        source={source}
        resizeMode="cover"
      />
    );
  }
}

/**
 * @typedef {import('../../models').Post} Post
 * @typedef {{ post: Post }} PostDetailContentProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {PostDetailContentProps & ViewProps} param0
 */
function PostDetailContent({ post, ...props }) {
  const carouselRef = useRef(null);
  const { width: screenWidth } = useWindowDimensions();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  return (
    <View style={[props.style]}>
      {(() => {
        switch (post.type) {
          // case 'video':
          case 'images':
            return (
              <View>
                <Carousel
                  useScrollView
                  contentContainerCustomStyle={{ alignItems: 'center' }}
                  ref={(c) => (carouselRef.current = c)}
                  data={post.media}
                  sliderWidth={screenWidth}
                  itemWidth={screenWidth * 0.85}
                  renderItem={({ item }) => <SliderImage item={item} />}
                  onSnapToItem={(index) => setActiveMediaIndex(index)}
                />
                <Pagination
                  containerStyle={{
                    paddingTop: values.spacing.lg,
                    paddingBottom: 0,
                  }}
                  dotsLength={post.media.length ?? 0}
                  activeDotIndex={activeMediaIndex}
                  dotStyle={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginHorizontal: values.spacing.sm,
                    backgroundColor: colors.gray700,
                  }}
                  inactiveDotStyle={{ backgroundColor: colors.gray300 }}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
                <Text style={postDetailContentStyles.caption}>
                  {post.caption ?? ''}
                </Text>
              </View>
            );
          case 'text': /* FALLTHROUGH */
          default:
            return (
              <View style={postDetailContentStyles.dialogBox}>
                <Text style={postDetailContentStyles.dialogBoxText}>
                  {post.caption ?? ''}
                </Text>
              </View>
            );
        }
      })()}
    </View>
  );
}

const postDetailContentStyles = StyleSheet.create({
  dialogBox: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md * 1.25,
    marginHorizontal: values.spacing.md,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: typography.size.md,
  },
  caption: {
    fontWeight: '600',
    fontSize: typography.size.md,
    marginTop: values.spacing.lg,
    marginBottom: values.spacing.md,
    marginHorizontal: values.spacing.md * 1.5,
  },
});

export default function PostDetailScreen() {
  const dispatch = useDispatch();

  /** @type {{ postId: string | undefined }} */
  const { postId = undefined } = useRoute().params || {};
  if (!postId) {
    console.error('[PostDetailScreen] No post ID given');
    return <RouteError />;
  }

  const post = useSelector((state) => selectPostById(state, postId));
  if (!post) {
    console.error('[PostDetailScreen] Failed to select post with id:', postId);
    return <RouteError />;
  }

  const commentIds = useSelector((state) => getCommentsForPost(state, postId));

  const isMounted = useRef(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  const [commentTextInput, setCommentTextInput] = useState('');
  const [isProcessingComment, setIsProcessingComment] = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        await Promise.all([
          dispatch(fetchPostById(String(postId))).unwrap(),
          dispatch(fetchCommentsForPost(String(postId))).unwrap(),
        ]);
      } catch (error) {
        console.error(
          '[PostDetailsScreen] Failed to fetch comments for post:',
          error,
        );
        setCommentsError(error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) fetchComments();
  }, [isInitialLoad]);

  useEffect(() => {
    const refreshData = async () => {
      try {
        await Promise.all([
          dispatch(fetchPostById(postId)).unwrap(),
          dispatch(fetchCommentsForPost(postId)).unwrap(),
        ]);
      } catch (error) {}
    };

    if (shouldRefresh) refreshData();
  }, [shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const handlePostComment = async () => {
    try {
      setIsProcessingComment(true);
      await dispatch(
        addCommentForPost({
          postId,
          message: commentTextInput,
        }),
      );
    } catch (error) {
      console.error('Failed to post comment:', error);
      Alert.alert(
        'Something went wrong',
        "Sorry, we weren't able to post your comment. Please try again later.",
      );
    } finally {
      setIsProcessingComment(false);
      setCommentTextInput('');
    }
  };

  const postContent = (
    <View>
      <PostDetailContent post={post} />
      <PostItemFooter
        post={post}
        options={{
          largeIcons: true,
          showActions: true,
          showShareIcon: true,
        }}
        style={{ margin: values.spacing.md }}
      />
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: colors.gray300,
          marginVertical: values.spacing.md,
          marginHorizontal: values.spacing.md,
        }}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flexGrow: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : -120}
        style={{ flex: 1 }}>
        <FlatList
          data={commentIds}
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: values.spacing.lg,
          }}
          ListHeaderComponent={postContent}
          ListEmptyComponent={
            isInitialLoad ? (
              <LoadingTabView
                message="Loading comments..."
                style={postDetailScreenStyles.tabView}
              />
            ) : commentsError ? (
              <ErrorTabView
                caption="We couldn't load the comments for this post."
                error={commentsError}
                style={postDetailScreenStyles.tabView}
              />
            ) : (
              <EmptyTabView
                message="No comments. Be the first one!"
                style={postDetailScreenStyles.tabView}
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={shouldRefresh}
              onRefresh={handleRefresh}
              colors={[colors.gray500]}
              tintColor={colors.gray500}
            />
          }
          renderItem={({ item: commentId }) => (
            <PostComment
              commentId={commentId}
              style={{ padding: values.spacing.md }}
            />
          )}
        />
        <View
          style={{
            minHeight: COMMENT_TEXT_INPUT_HEIGHT,
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: colors.white,
            borderColor: colors.gray100,
            borderTopWidth: values.border.thin,
          }}>
          <TextInput
            multiline
            maxLength={300}
            value={commentTextInput}
            onChangeText={setCommentTextInput}
            editable={!isProcessingComment}
            placeholder="Add your comment..."
            style={{
              flexGrow: 1,
              flexShrink: 1,
              paddingLeft: values.spacing.md * 1.5,
              ...(Platform.OS === 'ios'
                ? {
                    paddingTop: values.spacing.lg,
                    paddingBottom: values.spacing.lg,
                    paddingRight: values.spacing.md * 1.5,
                    minHeight: COMMENT_TEXT_INPUT_HEIGHT,
                  }
                : {}),
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const postDetailScreenStyles = StyleSheet.create({
  tabView: {
    flexGrow: 1,
    paddingTop: values.spacing.md,
  },
});
