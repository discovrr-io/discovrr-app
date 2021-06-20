import React, { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
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

  const [shouldRefresh, setShouldRefresh] = useState(false);

  const [comments, setComments] = useState([]);
  const [shouldLoadComments, setShouldLoadComments] = useState(true);
  const [commentsError, setCommentsError] = useState(null);

  // Determines if the component is mounted (and thus if the useEffect hook
  // can continue setting the state).
  // TODO: Consider creating a custom useAsync hook to handle this for you
  // const isSubscribed = useRef(true);

  useEffect(() => {
    async function fetchPost() {
      await dispatch(fetchPostById(postId));
      /* isSubscribed.current && */ setShouldRefresh(false);
    }

    const fetchComments = async () => {
      try {
        const comments = await fetchCommentsForPost(String(postId));
        /* isSubscribed.current && */ setComments(comments);
      } catch (error) {
        console.error('Failed to fetch comments for post:', error);
        /* isSubscribed.current && */ setCommentsError(error);
      } finally {
        /* isSubscribed.current && */ setShouldLoadComments(false);
      }
    };

    if (shouldRefresh) fetchPost();
    if (shouldLoadComments) fetchComments();
    // return () => (isSubscribed.current = false);
  }, [shouldRefresh, shouldLoadComments, dispatch]);

  const handleRefresh = () => {
    if (!shouldRefresh) {
      setShouldRefresh(true);
      setShouldLoadComments(true);
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
      <FlatList
        data={comments}
        renderItem={({ item: comment }) => (
          <PostComment
            comment={comment}
            style={{ padding: values.spacing.md }}
          />
        )}
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: values.spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={shouldRefresh}
            onRefresh={handleRefresh}
            colors={[colors.gray500]}
            tintColor={colors.gray500}
          />
        }
        ListHeaderComponent={postContent}
        ListEmptyComponent={
          shouldLoadComments ? (
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
      />
    </SafeAreaView>
  );
}

const postDetailScreenStyles = StyleSheet.create({
  tabView: {
    flexGrow: 1,
    paddingTop: values.spacing.md,
  },
});
