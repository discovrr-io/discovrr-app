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
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import {
  Button,
  EmptyTabView,
  ErrorTabView,
  RouteError,
  LoadingTabView,
  PostComment,
} from '../../components';
import { PostItemFooter } from '../../components/PostItem';
import { colors, typography, values } from '../../constants';
import { selectPostById } from './postsSlice';

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
    padding: values.spacing.md * 1.5,
    marginHorizontal: values.spacing.md,
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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = React.useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const comments = await fetchCommentsForPost(String(postId));
        setComments(comments);
      } catch (error) {
        console.error('Failed to fetch comments for post:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoading) fetchComments();
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
  const navigation = useNavigation();

  /** @type {{ postId?: string }} */
  const { postId = null } = useRoute().params || {};
  if (!postId) {
    console.error('[PostDetailScreen] No post ID given');
    return <RouteError />;
  }

  /** @type {import('../../models').Post | undefined} */
  const post = useSelector((state) => selectPostById(state, postId));

  if (!post) {
    return (
      <RouteError caption="We weren't able to load this post. Please try again later." />
    );
  }

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
              refreshing={false}
              colors={[colors.gray500]}
              tintColor={colors.gray500}
            />
          }>
          <View style={{ flexGrow: 1 }}>
            <PostDetailContent
              post={post}
              style={{ marginTop: values.spacing.md }}
            />
            <PostItemFooter
              post={post}
              options={{
                largeIcons: true,
                showActions: true,
                showShareIcon: true,
              }}
              style={{ marginHorizontal: values.spacing.md }}
            />
            <PostDetailComments postId={post.id} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
