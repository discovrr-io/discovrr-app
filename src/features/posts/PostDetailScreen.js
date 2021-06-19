import React, { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  FlatList,
  KeyboardAvoidingView,
  LogBox,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { useRoute } from '@react-navigation/core';
import { useDispatch, useSelector } from 'react-redux';

import {
  EmptyTabView,
  ErrorTabView,
  RouteError,
  LoadingTabView,
  PostComment,
} from '../../components';
import { PostItemFooter } from '../../components/PostItem';
import { colors, typography, values } from '../../constants';
import { fetchPostById, selectPostById } from './postsSlice';

const Parse = require('parse/react-native');

const TEXT_INPUT_HEIGHT = 35;

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
 * @typedef {import('../../models').PostId} PostId
 * @typedef {{ postId: PostId }} PostDetailContentProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {PostDetailContentProps & ViewProps} param0
 */
function PostDetailContent({ postId, ...props }) {
  /** @type {import('../../models').Post} */
  const post = useSelector((state) => selectPostById(state, postId));
  if (!post) {
    console.error('[PostDetailContent] Failed to find post with id:', postId);
    return null;
  }

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
    marginBottom: values.spacing.md,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: typography.size.md,
  },
  caption: {
    fontSize: typography.size.md,
    marginVertical: values.spacing.md * 1.5,
    marginHorizontal: values.spacing.md,
  },
});

/**
 * @typedef {import('../../models').PostId} PostId
 * @typedef {{ postId: PostId }} PostDetailCommentsProps
 * @param {PostDetailCommentsProps & ViewProps} param0
 */
function PostDetailComments({ postId, ...props }) {
  // Ignore warning that FlatList is nested in ScrollView for now
  LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determines if the component is mounted (and thus if the useEffect hook
  // can continue setting the state).
  // TODO: Consider creating a custom useAsync hook to handle this for you
  const isSubscribed = useRef(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const comments = await fetchCommentsForPost(String(postId));
        isSubscribed.current && setComments(comments);
      } catch (error) {
        console.error('Failed to fetch comments for post:', error);
        isSubscribed.current && setError(error);
      } finally {
        isSubscribed.current && setIsLoading(false);
      }
    };

    if (isLoading) fetchComments();

    return () => (isSubscribed.current = false);
  }, [isLoading]);

  return (
    <View style={[postDetailCommentsStyles.container, props.style]}>
      {isLoading ? (
        <LoadingTabView
          message="Loading comments..."
          style={postDetailCommentsStyles.tabViewContainer}
        />
      ) : error ? (
        <ErrorTabView
          error={error}
          style={postDetailCommentsStyles.tabViewContainer}
        />
      ) : (
        <FlatList
          data={comments}
          renderItem={({ item: comment }) => <PostComment comment={comment} />}
          ListEmptyComponent={
            <EmptyTabView
              message="No comments. Be the first one!"
              style={postDetailCommentsStyles.tabViewContainer}
            />
          }
        />
      )}
    </View>
  );
}

const postDetailCommentsStyles = StyleSheet.create({
  container: {
    marginHorizontal: values.spacing.md,
    marginTop: values.spacing.md,
  },
  tabViewContainer: {
    paddingTop: values.spacing.lg,
    paddingBottom: values.spacing.lg,
  },
  textInputContainer: {
    flexDirection: 'row',
    marginVertical: values.spacing.md,
    alignItems: 'flex-end',
  },
  commentTextInput: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: TEXT_INPUT_HEIGHT,
    borderColor: colors.gray700,
    borderWidth: values.border.thin,
    borderRadius: values.radius.md,
    padding: values.spacing.md,
  },
  postButton: {
    height: TEXT_INPUT_HEIGHT,
    width: 50,
    marginLeft: values.spacing.md,
  },
});

export default function PostDetailScreen() {
  const dispatch = useDispatch();

  /** @type {{ postId?: string }} */
  const { postId = undefined } = useRoute().params || {};
  if (!postId) {
    console.error('[PostDetailScreen] No post ID given');
    return <RouteError />;
  }

  // We'll request the latest changes as we open the post
  const [shouldRefresh, setShouldRefresh] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      await dispatch(fetchPostById(postId));
      setShouldRefresh(false);
    }

    if (shouldRefresh) fetchPost();
  }, [shouldRefresh, dispatch]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : -100}
        style={{ flexGrow: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={shouldRefresh}
              onRefresh={handleRefresh}
              colors={[colors.gray500]}
              tintColor={colors.gray500}
            />
          }>
          <View style={{ flexGrow: 1 }}>
            <PostDetailContent
              postId={postId}
              style={{ marginTop: values.spacing.md }}
            />
            <PostItemFooter
              postId={postId}
              options={{
                largeIcons: true,
                showActions: true,
                showShareIcon: true,
              }}
              style={{ marginHorizontal: values.spacing.md }}
            />
            <PostDetailComments postId={postId} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
