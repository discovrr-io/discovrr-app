import React, { useState } from 'react';
import {
  Alert,
  NativeEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { NotificationApi } from '../../api';
import {
  FEATURE_UNAVAILABLE,
  SOMETHING_WENT_WRONG,
} from '../../constants/strings';
import { selectProfileById } from '../profiles/profilesSlice';
import { selectPostById, changePostLikeStatus } from './postsSlice';

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
 * @typedef {{ post: Post, smallContent?: boolean, showShareIcon?: boolean, showMenuIcon?: boolean }} PostItemCardFooterProps
 *
 * @param {PostItemCardFooterProps & import('react-native').ViewProps} param0
 */
export function PostItemCardFooter({
  post,
  smallContent = false,
  showShareIcon = false,
  showMenuIcon = false,
  ...props
}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  /** @type {import('../authentication/authSlice').AuthState} */
  const { isAuthenticated, user: currentUser } = useSelector(
    (state) => state.auth,
  );

  if (!isAuthenticated) {
    console.warn(
      '[PostItemCardFooter]',
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
      profileId: profile?.id,
      profileName,
    });
  };

  const handlePressLike = async () => {
    try {
      setIsProcessingLike(true);

      const newDidLike = !didLike;
      console.log(
        `[PostItemCardFooter] Will ${newDidLike ? 'like' : 'unlike'} post...`,
      );

      // This will automatically handle the failure case by appropriately
      // setting the like statistics of the current post to its previous value
      await dispatch(
        changePostLikeStatus({
          postId: post.id,
          didLike: newDidLike,
        }),
      ).unwrap();

      // Only send a notification if the current user liked the post and it's not
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
          console.error(
            '[PostItemCardFooter] Failed to send notification:',
            error,
          );
        }
      }
    } catch (error) {
      console.error(
        '[PostItemCardFooter] Failed to change post like status:',
        error,
      );
      Alert.alert(SOMETHING_WENT_WRONG.title, SOMETHING_WENT_WRONG.message);
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

  const authorFontSize = smallContent ? typography.size.sm : typography.size.md;

  return (
    <View style={[postItemFooterStyles.container, props.style]}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        style={{ flex: 1 }}
        onPress={handlePressAvatar}>
        <View style={postItemFooterStyles.authorContainer}>
          <FastImage
            source={profileAvatar}
            style={{
              width: avatarIconSize,
              height: avatarIconSize,
              borderRadius: avatarIconSize / 2,
            }}
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
            onPress={alertUnimplementedFeature}>
            <MaterialCommunityIcon
              name="dots-horizontal"
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
}

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
export default function PostItemCard({
  postId,
  showFooter = true,
  smallContent = false,
  ...props
}) {
  const navigation = useNavigation();

  /** @type {import('../../models').Post | undefined} */
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
          {post.content.sources.length > 1 && (
            <View
              style={{
                position: 'absolute',
                zIndex: 1,
                top:
                  (smallContent ? values.spacing.sm : values.spacing.md) * 1.5,
                right:
                  (smallContent ? values.spacing.sm : values.spacing.md) * 1.5,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                paddingVertical: values.spacing.sm,
                paddingHorizontal: values.spacing.md,
                borderRadius: 20,
                minWidth: smallContent ? 22 : 38,
              }}>
              <Text
                style={{
                  color: colors.white,
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: smallContent
                    ? typography.size.md
                    : typography.size.h3,
                }}>
                {post.content.sources.length}
              </Text>
            </View>
          )}
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
}

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
