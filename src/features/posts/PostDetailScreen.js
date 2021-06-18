import React, { useRef, useState } from 'react';
import {
  useWindowDimensions,
  KeyboardAvoidingView,
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

import { Button } from '../../components';
import { PostItemFooter } from '../../components/PostItem';
import { colors, typography, values } from '../../constants';
import { selectPostById } from './postsSlice';

// const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');
// const defaultAvatar = require('../../../resources/images/defaultAvatar.jpeg');

const POST_DETAIL_ICON_SIZE = 32;
const AVATAR_DIAMETER = POST_DETAIL_ICON_SIZE;
const TEXT_INPUT_HEIGHT = 35;
const DEFAULT_ACTIVE_OPACITY = 0.6;

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
    marginTop: values.spacing.md * 1.5,
    marginHorizontal: values.spacing.md,
  },
});

/**
 * @typedef {{ post: Post }} PostDetailCommentsProps
 * @param {PostDetailCommentsProps & ViewProps} param0
 */
function PostDetailComments({ post, ...props }) {
  return (
    <View style={[postDetailCommentsStyles.container, props.style]}>
      <Text>{JSON.stringify(post)}</Text>
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
    console.warn('[PostDetailScreen] No post id given');
    return null;
  }

  /** @type {import('../../models').Post | undefined} */
  const post = useSelector((state) => selectPostById(state, postId));

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={[errorStyles.container]}>
          <Text style={[errorStyles.emoji]}>😓</Text>
          <Text style={[errorStyles.heading]}>Oops!</Text>
          <Text style={[errorStyles.caption]}>
            We couldn't load this page because the link you gave us doesn't seem
            to be right.
          </Text>
          <Button
            primary
            size="small"
            title="Take Me Back"
            onPress={() => navigation.navigate('HomeScreen')}
            style={[errorStyles.button]}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
            <PostDetailComments post={post} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const commonErrorStyles = {
  textAlign: 'center',
};

const errorStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: values.spacing.xxl,
  },
  emoji: {
    ...commonErrorStyles,
    fontSize: typography.size.h2 * 1.5,
    textAlign: 'center',
  },
  heading: {
    ...commonErrorStyles,
    fontSize: typography.size.h4,
    fontWeight: '600',
    marginTop: values.spacing.sm,
    marginBottom: values.spacing.md,
  },
  caption: {
    ...commonErrorStyles,
    fontSize: typography.size.md,
  },
  button: {
    marginTop: values.spacing.md * 1.5,
    width: '50%',
  },
});
