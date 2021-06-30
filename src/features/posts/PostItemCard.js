import React, { useState } from 'react';
// import PropTypes from 'prop-types';
import {
  Alert,
  NativeEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';

import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { NotificationApi, PostApi } from '../../api';
import { FEATURE_UNAVAILABLE } from '../../constants/strings';
import { selectProfileById } from '../profiles/profilesSlice';
import { selectPostById, postLikeStatusChanged } from './postsSlice';

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

const alertUnimplementedFeature = () => {
  Alert.alert(FEATURE_UNAVAILABLE.title, FEATURE_UNAVAILABLE.message);
};

/**
 * @typedef {import('../../models').Post} Post
 * @typedef {{ largeIcons?: boolean, showActions?: boolean, showShareIcon?: boolean }} FooterOptions
 * @typedef {{ post: Post, smallContent?: boolean, showShareIcon?: boolean, showMenuIcon?: boolean }} PostItemFooterProps
 *
 * @param {PostItemFooterProps & import('react-native').ViewProps} param0
 */
export const PostItemCardFooter = ({
  post,
  smallContent = false,
  showShareIcon = false,
  showMenuIcon = false,
  ...props
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const bottomSheetEmitter = new NativeEventEmitter('showPanel');

  /** @type {import('../authentication/authSlice').AuthState} */
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

  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isProcessingSave, _setIsProcessingSave] = useState(false);

  const handlePressAvatar = () => {
    navigation.push('UserProfileScreen', {
      profileId: profile.id,
      profileName,
    });
  };

  const handlePressLike = async () => {
    try {
      setIsProcessingLike(true);

      const newDidLike = !didLike;
      console.log(
        `[PostItemFooter] Will ${newDidLike ? 'like' : 'unlike'} post...`,
      );

      // FIXME: Waiting for like status to change sometimes takes too long
      dispatch(postLikeStatusChanged({ postId: post.id, didLike: newDidLike }));
      await PostApi.setLikeStatus(post.id, newDidLike);

      // Only send notification if the current user liked the post and it's not
      // their own post
      if (
        newDidLike &&
        !!currentUser &&
        currentUser.profile.id !== post.profileId
      ) {
        try {
          const { fullName = 'Someone' } = currentUser.profile ?? {};
          await NotificationApi.sendNotificationToProfileIds(
            [String(profile.id)],
            { en: `${fullName} liked your post!` },
            { en: "Looks like you're getting popular 😎" },
            `discovrr://post/${post.id}`,
          );
        } catch (error) {
          console.error('[PostItemFooter] Failed to send notification:', error);
        }
      }
    } catch (error) {
      console.error(
        '[PostItemFooter] Failed to change post like status:',
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

  const avatarIconSize = smallContent
    ? iconSize.small.avatar
    : iconSize.large.avatar;

  const actionIconSize = smallContent
    ? iconSize.small.action
    : iconSize.large.action;

  const actionIconMarginRight = smallContent
    ? values.spacing.sm * 1.25
    : values.spacing.md * 1.5;

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
        {showMenuIcon && (
          <TouchableOpacity
            disabled={false}
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={() =>
              bottomSheetEmitter.emit('showPanel', {
                contentSelector: 'reportPost',
              })
            }>
            <MaterialCommunityIcon
              // name="dots-vertical"
              name="flag-outline"
              color={colors.gray}
              size={actionIconSize}
              style={{ marginRight: actionIconMarginRight * 0.75 }}
            />
          </TouchableOpacity>
        )}
        {showShareIcon && (
          <TouchableOpacity
            disabled={false}
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={alertUnimplementedFeature}>
            <MaterialIcon
              name="share"
              color={colors.gray}
              size={actionIconSize * 0.9}
              style={{ marginRight: actionIconMarginRight }}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={isProcessingSave}
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={alertUnimplementedFeature}>
          <MaterialIcon
            name={didSave ? 'bookmark' : 'bookmark-outline'}
            color={didSave ? colors.black : colors.gray}
            size={actionIconSize}
            style={{ marginRight: actionIconMarginRight }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isProcessingLike}
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={handlePressLike}>
          <Animatable.View key={didLike.toString()} animation="bounceIn">
            <MaterialIcon
              name={didLike ? 'favorite' : 'favorite-border'}
              color={didLike ? colors.red500 : colors.gray}
              size={actionIconSize}
            />
          </Animatable.View>
        </TouchableOpacity>
        <Text
          style={[
            postItemFooterStyles.likesCount,
            {
              fontSize: smallContent ? typography.size.xs : typography.size.sm,
            },
          ]}>
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
  likesCount: {
    marginLeft: values.spacing.xxs,
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
    navigation.push('PostDetailScreen', { postId });
  };

  const PostItemCardCaption = ({ caption }) => {
    return (
      <View style={postItemStyles.captionContainer}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: smallContent ? typography.size.sm : typography.size.md,
            paddingVertical: smallContent
              ? values.spacing.xs
              : values.spacing.sm,
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
            resizeMode="cover"
            style={{
              aspectRatio: imagePreviewWidth / imagePreviewHeight,
              backgroundColor: colors.gray100,
              borderRadius: values.radius.md,
              borderWidth: values.border.thin,
              borderColor: colors.gray300,
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
                  ? typography.size.sm
                  : typography.size.md,
                padding: smallContent
                  ? values.spacing.md
                  : values.spacing.md * 1.25,
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
    paddingVertical: values.spacing.xs,
    paddingHorizontal: values.spacing.sm,
  },
  dialogBox: {
    backgroundColor: colors.gray100,
    borderWidth: values.border.thin,
    borderColor: colors.gray300,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    marginBottom: values.spacing.md,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '500',
  },
});

export default PostItemCard;
