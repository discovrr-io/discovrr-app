import React, { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewProps,
} from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
// import Video from 'react-native-video';
import { useRoute } from '@react-navigation/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PostComment from '../comments/PostComment';
import { colors, typography, values } from '../../constants';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';
import { useAppDispatch, useAppSelector, useIsMounted } from '../../hooks';
import { ImageSource } from '../../models/common';
import { Post, PostId } from '../../models';
import { DEFAULT_IMAGE_DIMENSIONS } from '../../constants/media';
import { PostItemCardFooter } from './PostItemCard';

import {
  fetchPostById,
  selectPostById,
  updatePostViewCounter,
} from './postsSlice';

import {
  addCommentForPost,
  fetchCommentsForPost,
  selectCommentsForPost,
} from '../comments/commentsSlice';

import {
  EmptyTabView,
  ErrorTabView,
  RouteError,
  LoadingTabView,
  LoadingOverlay,
} from '../../components';

const COMMENT_TEXT_INPUT_MIN_HEIGHT = 50;
const COMMENT_TEXT_INPUT_MAX_HEIGHT = 200;
const COMMENT_POST_BUTTON_WIDTH = 70;

// TODO: Refactor out
function isOverFiveMinutes(date: string | number | Date) {
  if (!date) return false;

  const FIVE_MINS = 5 * 60 * 1000;
  const now = new Date();
  const then = new Date(date);
  return now.valueOf() - then.valueOf() > FIVE_MINS;
}

type SliderImageProps = {
  item: ImageSource;
};

function SliderImage({ item: source }: SliderImageProps) {
  let dimensions: { width: number; height: number };
  if (typeof source === 'number') {
    dimensions = DEFAULT_IMAGE_DIMENSIONS;
  } else {
    dimensions = {
      width: source.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
      height: source.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
    };
  }

  return (
    <FastImage
      style={{
        aspectRatio: dimensions.width / dimensions.height,
        borderRadius: values.radius.md,
      }}
      source={source}
      resizeMode="cover"
    />
  );
}

type PostDetailContentProps = ViewProps & {
  post: Post;
};

function PostDetailContent(props: PostDetailContentProps) {
  const { post, ...restProps } = props;

  const carouselRef = useRef<Carousel<ImageSource> | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const renderPostContent = () => {
    switch (post.content.type) {
      case 'image-gallery':
        return (
          <View>
            <Carousel
              useScrollView
              contentContainerCustomStyle={{ alignItems: 'center' }}
              ref={(c) => (carouselRef.current = c)}
              data={post.content.sources}
              sliderWidth={screenWidth}
              itemWidth={screenWidth * 0.85}
              renderItem={({ item }: { item: ImageSource }) => (
                <SliderImage item={item} />
              )}
              onSnapToItem={setActiveMediaIndex}
            />
            <Pagination
              dotsLength={post.content.sources.length}
              activeDotIndex={activeMediaIndex}
              dotStyle={{
                width: 10,
                height: 10,
                borderRadius: 5,
                marginHorizontal: values.spacing.sm,
                backgroundColor: colors.gray700,
              }}
              containerStyle={{
                paddingTop: values.spacing.lg,
                paddingBottom: 0,
              }}
              inactiveDotStyle={{ backgroundColor: colors.gray300 }}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
            <Text
              style={[
                postDetailContentStyles.caption,
                post.location && { marginBottom: 0 },
              ]}>
              {post.content.caption}
            </Text>
          </View>
        );
      case 'video':
        // return (
        //   <Video
        //     paused
        //     allowsExternalPlayback={false}
        //     resizeMode="cover"
        //     source={post.content.source}
        //     style={{
        //       // FIXME: source may be number
        //       // aspectRatio: post.content.source.width / post.content.source.height,
        //       borderRadius: values.radius.md,
        //     }}
        //   />
        // );
        return <Text>(VIDEO)</Text>;
      case 'text': /* FALLTHROUGH */
      default:
        return (
          <View
            style={[
              postDetailContentStyles.dialogBox,
              post.location && {
                marginBottom: values.spacing.md,
              },
            ]}>
            <Text style={postDetailContentStyles.dialogBoxText}>
              {post.content.text}
            </Text>
          </View>
        );
    }
  };
  return (
    <View style={[restProps.style]}>
      {renderPostContent()}
      {post.location && (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.gray500,
            marginHorizontal: values.spacing.md,
            marginTop: values.spacing.xs * 1.5,
            marginBottom: values.spacing.md,
          }}>
          {post.location.text}
        </Text>
      )}
    </View>
  );
}

const postDetailContentStyles = StyleSheet.create({
  dialogBox: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md * 1.25,
    marginHorizontal: values.spacing.md,
  },
  dialogBoxText: {
    fontWeight: '500',
    fontSize: typography.size.lg,
    color: colors.black,
  },
  caption: {
    fontWeight: '500',
    fontSize: typography.size.md,
    marginTop: values.spacing.lg,
    marginBottom: values.spacing.md,
    marginHorizontal: values.spacing.md,
  },
});

function LoadedPostDetailScreen({ post }: { post: Post }) {
  const $FUNC = '[LoadedPostDetailScreen]';
  const dispatch = useAppDispatch();

  const postStatus = useAppSelector((state) => state.posts.status);

  const { bottom: bottomInsets } = useSafeAreaInsets();

  const currentUserProfileId = useAppSelector(
    (state) => state.auth.user.profileId,
  );
  const isMyPost = post.profileId === currentUserProfileId;

  const commentIds = useAppSelector((state) =>
    selectCommentsForPost(state, post.id),
  );

  const isMounted = useIsMounted();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  const [commentTextInput, setCommentTextInput] = useState('');
  const [isProcessingComment, setIsProcessingComment] = useState(false);

  useEffect(() => {
    const { lastViewed } = post.statistics ?? {};

    // We don't want to count views in development mode or if it's the user's
    // own post
    if (
      (!__DEV__ && !lastViewed && !isMyPost) ||
      isOverFiveMinutes(lastViewed)
    ) {
      console.log($FUNC, 'Updating last viewed date-time...');
      dispatch(
        updatePostViewCounter({
          postId: post.id,
          lastViewed: new Date().toJSON(),
        }),
      );
    }
  }, []);

  useEffect(() => {
    if (isInitialLoad || shouldRefresh)
      (async () => {
        try {
          await Promise.all([
            dispatch(fetchPostById(String(post.id))).unwrap(),
            dispatch(fetchCommentsForPost(String(post.id))).unwrap(),
          ]);
        } catch (error) {
          console.error($FUNC, 'Failed to fetch comments for post:', error);
          isMounted.current && setCommentsError(error);
        } finally {
          if (isMounted.current) {
            if (isInitialLoad) setIsInitialLoad(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [isInitialLoad, shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const handlePostComment = async () => {
    try {
      setIsProcessingComment(true);
      const addCommentAction = addCommentForPost({
        postId: post.id,
        message: commentTextInput.trim(),
      });

      await dispatch(addCommentAction).unwrap();
      // TODO: Send notification when user posts a comment
    } catch (error) {
      console.error($FUNC, 'Failed to post comment:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "Sorry, we weren't able to post your comment. Please try again later.",
      );
    } finally {
      if (isMounted.current) {
        setIsProcessingComment(false);
        setCommentTextInput('');
      }
    }
  };

  const canPostComment =
    !isProcessingComment && commentTextInput.trim().length > 3;

  const PostContent = () => (
    <View>
      <PostDetailContent post={post} />
      <PostItemCardFooter
        post={post}
        showShareIcon
        showMenuIcon
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
    <>
      <SafeAreaView style={{ flexGrow: 1, backgroundColor: colors.white }}>
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={
            Platform.OS === 'ios' ? 65 + Math.max(0, bottomInsets - 8) : -190
          }
          style={{ flex: 1 }}>
          <FlatList
            data={commentIds}
            keyExtractor={(comment) => String(comment)}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: values.spacing.lg,
              paddingBottom: values.spacing.huge * 2,
            }}
            ListHeaderComponent={PostContent}
            ListEmptyComponent={
              isInitialLoad ? (
                <LoadingTabView
                  message="Loading comments..."
                  style={postDetailScreenStyles.tabView}
                />
              ) : commentsError ? (
                <ErrorTabView
                  caption="We weren't able to get comments for this post."
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
              minHeight: COMMENT_TEXT_INPUT_MIN_HEIGHT,
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: colors.white,
              borderColor: colors.gray200,
              borderTopWidth: values.border.thin,
            }}>
            <TextInput
              multiline
              maxLength={300}
              value={commentTextInput}
              onChangeText={setCommentTextInput}
              editable={!isProcessingComment}
              placeholder="Add your comment..."
              placeholderTextColor={colors.gray500}
              style={{
                flexGrow: 1,
                flexShrink: 1,
                paddingLeft: values.spacing.md * 1.5,
                ...(Platform.OS === 'ios'
                  ? {
                      paddingTop: values.spacing.lg,
                      paddingBottom: values.spacing.lg,
                      paddingRight: values.spacing.md * 1.5,
                      minHeight: COMMENT_TEXT_INPUT_MIN_HEIGHT,
                      maxHeight: COMMENT_TEXT_INPUT_MAX_HEIGHT,
                    }
                  : {}),
              }}
            />
            <TouchableOpacity
              disabled={!canPostComment}
              onPress={handlePostComment}
              style={{
                justifyContent: 'center',
                height: COMMENT_TEXT_INPUT_MIN_HEIGHT,
                width: COMMENT_POST_BUTTON_WIDTH,
              }}>
              {isProcessingComment ? (
                <ActivityIndicator size="small" color={colors.gray500} />
              ) : (
                <Text
                  style={{
                    textAlign: 'center',
                    color: !canPostComment ? colors.gray500 : colors.accent,
                    fontSize: typography.size.md,
                  }}>
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {postStatus === 'deleting' && (
        <LoadingOverlay message="Deleting post..." />
      )}
    </>
  );
}

const postDetailScreenStyles = StyleSheet.create({
  tabView: {
    flexGrow: 1,
    paddingTop: values.spacing.md,
  },
});

export default function PostDetailScreen() {
  const $FUNC = '[PostDetailScreen]';

  const { postId }: { postId?: PostId | undefined } = useRoute().params ?? {};
  if (!postId) {
    console.error($FUNC, 'No post ID was given');
    return <RouteError />;
  }

  const post = useAppSelector((state) => selectPostById(state, postId));
  const postStatus = useAppSelector((state) => state.posts.status);

  // FIXME: A previously rejected post would have set this status to 'rejected',
  // meaning that future inspections of the status will also return 'rejected'.
  // For now we'll disabled this.
  if (/* postStatus === 'rejected' && */ !post) {
    console.error($FUNC, 'Failed to select post with id:', postId);
    return <RouteError />;
  }

  return <LoadedPostDetailScreen post={post} />;
}
