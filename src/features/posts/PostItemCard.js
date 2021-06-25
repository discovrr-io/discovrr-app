import React from 'react';
// import PropTypes from 'prop-types';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import OneSignal from 'react-native-onesignal';
import * as Animatable from 'react-native-animatable';

import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import {
  colors,
  typography,
  values,
  DEFAULT_ACTIVE_OPACITY,
} from '../../constants';
import {
  DEFAULT_AVATAR,
  DEFAULT_IMAGE_DIMENSIONS,
} from '../../constants/media';
import { PostApi } from '../../api';
import { selectProfileById } from '../profiles/profilesSlice';
import { selectPostById, postLikeStatusChanged } from './postsSlice';

const SMALL_ICON = 24;
const LARGE_ICON = 32;

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
 * @typedef {import('../models').Post} Post
 * @typedef {{ largeIcons?: boolean, showActions?: boolean, showShareIcon?: boolean }} FooterOptions
 * @typedef {{ post: Post, smallContent?: boolean, showShareIcon?: boolean }} PostItemFooterProps
 *
 * @param {PostItemFooterProps & import('react-native').ViewProps} param0
 */
export const PostItemCardFooter = ({
  post,
  smallContent = false,
  showShareIcon = false,
  ...props
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  /** @type {import('../features/authentication/authSlice').AuthState} */
  const { isAuthenticated, user: currentUser } = useSelector(
    (state) => state.auth,
  );

  if (!isAuthenticated) {
    console.warn(
      '[PostItemFooter]',
      'Current user is not authenticated, which is unexpected',
    );
  }

  /** @type {import('../../models').Profile | undefined} */
  const profile = useSelector((state) =>
    selectProfileById(state, post.profileId),
  );

  const profileName =
    (profile?.fullName ?? '').length > 1 ? profile?.fullName : 'Anonymous';

  let profileAvatar;
  if (profile && profile.avatar) {
    profileAvatar = profile.avatar;
  } else {
    profileAvatar = DEFAULT_AVATAR;
  }

  const { didSave, didLike, totalLikes } = post.statistics ?? {
    didSave: false,
    didLike: false,
    totalLikes: 0,
  };

  const [isProcessingLike, setIsProcessingLike] = React.useState(false);
  const [isProcessingSave, _setIsProcessingSave] = React.useState(false);

  const handlePressAvatar = () => {
    navigation.push('UserProfileScreen', { profileId: profile.id });
  };

  const handlePressShare = () => {
    console.warn('[PostItemCard.handlePressShare] Unimplemented action');
  };

  const handlePressLike = async () => {
    try {
      const newDidLike = !didLike;
      console.log(
        `[PostItemFooter.handlePressLike] Will ${
          newDidLike ? 'like' : 'unlike'
        } post...`,
      );

      // FIXME: Like button not updating instantly
      setIsProcessingLike(true);
      dispatch(postLikeStatusChanged({ postId: post.id, didLike: newDidLike }));
      await PostApi.setLikeStatus(post.id, newDidLike);

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
      console.error(error);
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

  const avatarIconSize = smallContent
    ? iconSize.small.avatar
    : iconSize.large.avatar;

  const actionIconSize = smallContent
    ? iconSize.small.action
    : iconSize.large.action;

  const authorFontSize = smallContent ? typography.size.xs : typography.size.md;

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
            source={profileAvatar}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              postItemFooterStyles.authorName,
              { fontSize: authorFontSize },
            ]}>
            {profileName}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={postItemFooterStyles.actionsContainer}>
        {showShareIcon && (
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
          {totalLikes > 999 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}
        </Text>
      </View>
    </View>
  );
};

// PostItemCardFooter.propTypes = {
//   post: PropTypes.object.isRequired,
//   options: PostItemFooterOptions,
// };

const postItemFooterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
 *   showFooter?: boolean,
 *   smallContent?: boolean,
 * }} PostItemCardProps
 *
 * @param {PostItemCardProps & import('react-native').ViewProps} param0
 */
const PostItemCard = ({
  postId,
  showFooter = true,
  smallContent = false,
  ...props
}) => {
  const navigation = useNavigation();

  /** @type {import('../models').Post | undefined} */
  const post = useSelector((state) => selectPostById(state, postId));
  if (!post) {
    console.warn('[PostItemCard] Failed to select post with id:', postId);
    return null;
  }

  const handlePostPress = () => {
    navigation.navigate('PostDetailScreen', { postId });
  };

  const PostItemCardCaption = ({ caption }) => {
    return (
      <View style={postItemStyles.captionContainer}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: smallContent ? typography.size.sm : typography.size.md,
          }}>
          {caption}
        </Text>
      </View>
    );
  };

  let cardContent;
  switch (post.content.type) {
    case 'image-gallery':
      const imagePreviewSource = post.content.sources[0];
      let imagePreviewWidth, imagePreviewHeight;

      if (typeof imagePreviewSource === 'number') {
        imagePreviewWidth = DEFAULT_IMAGE_DIMENSIONS.width;
        imagePreviewHeight = DEFAULT_IMAGE_DIMENSIONS.height;
      } else {
        imagePreviewWidth = imagePreviewSource.width;
        imagePreviewHeight = imagePreviewSource.height;
      }

      cardContent = (
        <View>
          <FastImage
            source={post.content.sources[0]}
            resizeMode="contain"
            style={{
              aspectRatio: imagePreviewWidth / imagePreviewHeight,
              backgroundColor: colors.gray100,
              borderRadius: values.radius.md,
            }}
          />
          <PostItemCardCaption caption={post.content.caption} />
        </View>
      );
      break;
    case 'video':
      cardContent = (
        <View>
          <Text>VIDEO</Text>
          <PostItemCardCaption caption={post.content.caption} />
        </View>
      );
      break;
    case 'text': /* FALLTHROUGH */
    default:
      cardContent = (
        <View style={postItemStyles.dialogBox}>
          <Text
            numberOfLines={smallContent ? 5 : 15}
            style={[
              postItemStyles.dialogBoxText,
              {
                fontSize: smallContent
                  ? typography.size.md
                  : typography.size.lg,
              },
            ]}>
            {post.content.text}
          </Text>
        </View>
      );
      break;
  }

  return (
    <View style={[props.style]}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={handlePostPress}>
        {cardContent}
      </TouchableOpacity>
      {showFooter && (
        <PostItemCardFooter
          post={post}
          smallContent={smallContent}
          style={{ marginHorizontal: values.spacing.sm }}
        />
      )}
    </View>
  );
};

// PostItemCard.propTypes = {
//   postId: PropTypes.string.isRequired,
//   column: PropTypes.number,
//   imagePreview: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
//   imagePreviewDimensions: PropTypes.shape({
//     width: PropTypes.number.isRequired,
//     height: PropTypes.number.isRequired,
//   }),
//   displayFooter: PropTypes.bool,
//   footerOptions: PostItemFooterOptions,
// };

const postItemStyles = StyleSheet.create({
  captionContainer: {
    paddingVertical: values.spacing.sm,
    paddingHorizontal: values.spacing.sm,
  },
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
    fontWeight: '600',
  },
});

export default PostItemCard;
