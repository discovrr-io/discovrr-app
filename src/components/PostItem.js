import React from 'react';
import PropTypes from 'prop-types';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import OneSignal from 'react-native-onesignal';
import * as Animatable from 'react-native-animatable';

import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectPostById,
  postLikeStatusChanged,
} from '../features/posts/postsSlice';
import { selectProfileById } from '../features/profile/profilesSlice';
import { colors, typography, values } from '../constants';

const Parse = require('parse/react-native');

// const imagePlaceholder = require('../../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../../resources/images/defaultAvatar.jpeg');

const SMALL_ICON = 24;
const LARGE_ICON = 32;
const DEFAULT_ACTIVE_OPACITY = 0.6;

const iconSize = {
  small: {
    action: SMALL_ICON,
    avatar: SMALL_ICON,
  },
  large: {
    action: LARGE_ICON,
    avatar: LARGE_ICON,
  },
};

/**
 * @typedef {import('../features/posts/postsSlice').Post} Post
 * @typedef {{ largeIcons?: boolean, showActions?: boolean, showShareIcon?: boolean }} FooterOptions
 * @typedef {{ post: Post, options?: FooterOptions }} PostItemFooterProps
 *
 * @param {PostItemFooterProps & import('react-native').ViewProps} param0
 */
export const PostItemFooter = ({
  post,
  options = { largeIcons: false, showActions: true, showShareIcon: false },
  ...props
}) => {
  const dispatch = useDispatch();

  /** @type {import('../models').Profile | undefined} */
  const profile = useSelector((state) =>
    selectProfileById(state, post.profileId),
  );

  /** @type {import('../features/authentication/authSlice').AuthState} */
  const { isAuthenticated, user: currentUser } = useSelector(
    (state) => state.auth,
  );

  if (!isAuthenticated) {
    console.warn('[PostItemFooter] Current user is not authenticated');
  }

  /**
   * @typedef {import('../features/authentication/authSlice').ProfileAvatar} ProfileAvatar
   * @type {{ avatar: ProfileAvatar, fullName: string }}
   */
  const { avatar = defaultAvatar, fullName = 'Anonymous' } = profile || {};

  const [isProcessingLike, setIsProcessingLike] = React.useState(false);
  const [isProcessingSave, _setIsProcessingSave] = React.useState(false);

  const didLike = post.metrics.didLike;
  const didSave = post.metrics.didSave;
  const totalLikes = post.metrics.totalLikes;

  const handlePressAvatar = () => {};
  const handlePressShare = () => {};

  const handlePressLike = async () => {
    try {
      const newDidLike = !didLike;
      console.log(
        `[PostItemFooter.handlePressLike] Will ${
          newDidLike ? 'like' : 'unlike'
        } post...`,
      );

      setIsProcessingLike(true);
      dispatch(postLikeStatusChanged({ postId: post.id, didLike: newDidLike }));

      await Parse.Cloud.run('likeOrUnlikePost', {
        postId: post.id,
        like: newDidLike,
      });
      console.log(
        `[PostItemFooter.handlePressLike] Successfully ${
          newDidLike ? 'liked' : 'unliked'
        } post`,
      );

      // Only send notification if current user liked the post
      if (newDidLike && isAuthenticated && currentUser) {
        const { fullName } = currentUser.profile;
        const recipientPlayerIds = profile.oneSignalPlayerIds;

        if (recipientPlayerIds && recipientPlayerIds.length > 0) {
          const notificationParams = JSON.stringify({
            include_player_ids: recipientPlayerIds,
            headings: { en: `${fullName} liked your post` },
            contents: { en: `Looks like you're getting popular! 😎` },
          });

          console.log(
            'Will send notification with params:',
            notificationParams,
          );

          OneSignal.postNotification(
            notificationParams,
            (success) => {
              console.log(
                '[OneSignal] Successfully posted notification:',
                success,
              );
            },
            (error) => {
              console.log('[OneSignal] Failed to posted notification:', error);
            },
          );
        }
      }
    } catch (error) {
      console.error(
        '[PostItemFooter.handlePressLike] Failed to like post:',
        error,
      );
      Alert.alert(
        'Something went wrong',
        `We weren't able to complete your request. Please try again later.`,
        [{ text: 'Dismiss' }],
      );
      dispatch(postLikeStatusChanged({ postId: post.id, didLike }));
    } finally {
      setIsProcessingLike(false);
    }
  };

  const handlePressSave = async () => {
    console.warn('Unimplemented: handlePressSave');
  };

  const avatarIconSize = options.largeIcons
    ? iconSize.large.avatar
    : iconSize.small.avatar;

  const actionIconSize = options.largeIcons
    ? iconSize.large.action
    : iconSize.small.action;

  const authorFontSize = options.largeIcons
    ? typography.size.md
    : typography.size.xs;

  return (
    <View style={[postItemFooterStyles.container, props.style]}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        style={{ flex: 1 }}
        onPress={handlePressAvatar}>
        <View style={postItemFooterStyles.authorContainer}>
          <FastImage
            style={{
              width: avatarIconSize,
              height: avatarIconSize,
              borderRadius: avatarIconSize / 2,
            }}
            source={avatar}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              postItemFooterStyles.authorName,
              { fontSize: authorFontSize },
            ]}>
            {fullName || 'Anonymous'}
          </Text>
        </View>
      </TouchableOpacity>
      {options.showActions && (
        <View style={postItemFooterStyles.actionsContainer}>
          {options.showShareIcon && (
            <TouchableOpacity
              disabled={false}
              activeOpacity={DEFAULT_ACTIVE_OPACITY}
              onPress={handlePressShare}>
              <MaterialIcon
                style={postItemFooterStyles.actionButton}
                name="share"
                color={colors.gray}
                size={actionIconSize}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            disabled={isProcessingSave}
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={handlePressSave}>
            <MaterialIcon
              style={postItemFooterStyles.actionButton}
              name={didSave ? 'bookmark' : 'bookmark-outline'}
              color={didSave ? colors.black : colors.gray}
              size={actionIconSize}
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isProcessingLike}
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={handlePressLike}>
            <Animatable.View key={didLike.toString()} animation="bounceIn">
              <MaterialIcon
                style={postItemFooterStyles.actionButton}
                name={didLike ? 'favorite' : 'favorite-border'}
                color={didLike ? 'red' : colors.gray}
                size={actionIconSize}
              />
            </Animatable.View>
          </TouchableOpacity>
          <Text style={postItemFooterStyles.likesCount}>
            {totalLikes > 999
              ? `${(totalLikes / 1000).toFixed(1)}k`
              : totalLikes}
          </Text>
        </View>
      )}
    </View>
  );
};

const PostItemFooterOptions = PropTypes.shape({
  largeIcons: PropTypes.bool,
  showActions: PropTypes.bool,
  showShareIcon: PropTypes.bool,
});

PostItemFooter.propTypes = {
  post: PropTypes.object.isRequired,
  options: PostItemFooterOptions,
};

const postItemFooterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: values.spacing.xs,
    marginTop: values.spacing.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: values.spacing.sm * 1.5,
    color: colors.black,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: values.spacing.sm,
  },
  likesCount: {
    marginLeft: values.spacing.zero,
    fontSize: typography.size.xs,
    alignSelf: 'flex-end',
  },
});

/**
 * @typedef {import('../models').PostId} PostId
 * @typedef {import('../models/post').PostType} PostType
 * @typedef {{
 *   postId: PostId,
 *   type: PostType,
 *   column?: number,
 *   imagePreview?: Object,
 *   imagePreviewDimensions?: { height: number, width: number },
 *   displayFooter?: boolean,
 *   footerOptions: FooterOptions
 * }} PostItemProps
 *
 * @param {PostItemProps & import('react-native').ViewProps} param0
 */
const PostItem = ({
  postId,
  type = 'text',
  column = 0,
  imagePreview = {},
  imagePreviewDimensions = { width: 1, height: 1 },
  displayFooter = true,
  footerOptions = {
    largeIcons: false,
    showActions: true,
    showShareIcon: false,
  },
  ...props
}) => {
  const navigation = useNavigation();

  /** @type {import('../features/posts/postsSlice').Post | undefined} */
  const post = useSelector((state) => selectPostById(state, postId));
  const caption = post.caption;

  const onPressPost = () => {
    navigation.navigate('PostDetailScreen', { postId });
  };

  const PostItemContent = ({ onPressPost, ...props }) => {
    const PostItemContentCaption = ({ caption, maxWidth }) => {
      return (
        <Text
          style={{
            maxWidth,
            fontWeight: '600',
            fontSize: typography.size.xs,
            marginTop: values.spacing.sm,
            marginHorizontal: values.spacing.sm,
            color: colors.gray700,
          }}
          numberOfLines={2}
          ellipsizeMode="tail">
          {caption}
        </Text>
      );
    };

    const [isImageLoaded, setIsImageLoaded] = React.useState(false);
    const onImageLoad = (loadEvent) => {
      if (loadEvent) setIsImageLoaded(true);
    };

    switch (post.type) {
      case 'text':
        return (
          <View
            style={[
              postItemStyles.dialogBox,
              { maxWidth: imagePreviewDimensions.width },
              props.style,
            ]}>
            <Text
              numberOfLines={6}
              ellipsizeMode="tail"
              style={postItemStyles.dialogBoxText}>
              {caption}
            </Text>
          </View>
        );
      case 'video' /* FALLTHROUGH */:
        console.warn(
          `Unimplemented: 'video' post item. Defaulting to 'images'...`,
        );
      case 'images':
        const { width, height } = imagePreviewDimensions;
        return (
          <View style={[props.style]}>
            <FastImage
              onLoad={onImageLoad}
              source={imagePreview}
              style={{
                width,
                height,
                resizeMode: 'cover',
                borderRadius: values.radius.md,
                borderWidth: 1,
                borderColor: colors.gray300,
                backgroundColor: colors.gray100,
              }}
            />
            <PostItemContentCaption maxWidth={width} caption={caption} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        {
          maxWidth: imagePreviewDimensions.width,
          marginBottom: values.spacing.lg,
          marginHorizontal: values.spacing.xs,
        },
        props.style,
      ]}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={onPressPost}>
        <PostItemContent onPressPost={onPressPost} />
      </TouchableOpacity>
      {displayFooter && <PostItemFooter post={post} options={footerOptions} />}
    </View>
  );
};

PostItem.propTypes = {
  postId: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['text', 'images', 'video']),
  column: PropTypes.number,
  imagePreview: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  imagePreviewDimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }),
  displayFooter: PropTypes.bool,
  footerOptions: PostItemFooterOptions,
};

const postItemStyles = StyleSheet.create({
  dialogBox: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderWidth: values.border.thin,
    borderColor: colors.gray500,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    padding: values.spacing.md,
    marginBottom: values.spacing.sm,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '700',
  },
});

export default PostItem;
