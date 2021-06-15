import React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import OneSignal from 'react-native-onesignal';
import * as Animatable from 'react-native-animatable';

import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import { colors, messages, typography, values } from '../constants';
import * as actions from '../utilities/Actions';

// const imagePlaceholder = require('../../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../../resources/images/defaultAvatar.jpeg');

const DEFAULT_ACTIVE_OPACITY = 0.6;

const Parse = require('parse/react-native');

export const PostItemKind = {
  TEXT: 'TEXT',
  MEDIA: 'MEDIA',
  VIDEO: 'VIDEO', // TODO: Remove
};

const AuthorPropTypes = PropTypes.shape({
  avatar: PropTypes.oneOfType([
    PropTypes.shape({ url: PropTypes.string.isRequired }),
    PropTypes.number,
  ]),
  name: PropTypes.string.isRequired,
});

const MetricsPropTypes = PropTypes.shape({
  likesCount: PropTypes.number.isRequired,
  hasLiked: PropTypes.bool.isRequired,
  hasSaved: PropTypes.bool.isRequired,
});

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

async function getCurrentUserName() {
  const currentUser = await Parse.User.currentAsync();
  const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
  profileQuery.equalTo('owner', currentUser);

  const result = await profileQuery.first();
  const name = result.get('name');
  const displayName = result.get('displayName');

  return (name || displayName) ?? 'Someone';
}

export const PostItemFooter = ({
  id,
  author,
  metrics,
  options = { largeIcons: false, showActions: true, showShareIcon: false },
  onPressSave = async () => {},
  ...props
}) => {
  // const dispatch = useDispatch();
  const navigation = useNavigation();

  const avatarSource = author.avatar
    ? { uri: author.avatar.url }
    : defaultAvatar;

  const [isProcessingLike, setIsProcessingLike] = React.useState(false);
  const [isProcessingSave, setIsProcessingSave] = React.useState(false);

  const [hasSaved, setHasSaved] = React.useState(metrics.hasLiked);
  const [hasLiked, setHasLiked] = React.useState(metrics.hasLiked);
  const [likesCount, setLikesCount] = React.useState(metrics.likesCount);

  const handlePressAvatar = () => {
    navigation.push('UserProfileScreen', {
      userProfile: author,
      metrics: metrics,
    });
  };

  const handlePressShare = async () => {
    // console.warn('Unimplemented: handlePressShare');
    await onPressSave();
  };

  const handlePressLike = async () => {
    const oldHasLiked = hasLiked;
    const oldLikesCount = likesCount;
    setIsProcessingLike(true);

    try {
      setHasLiked(!oldHasLiked);
      setLikesCount((prev) => Math.max(0, prev + (!oldHasLiked ? 1 : -1)));

      await Parse.Cloud.run('likeOrUnlikePost', {
        postId: id,
        like: !oldHasLiked,
      });

      if (!oldHasLiked && author.id) {
        const Profile = Parse.Object.extend('Profile');
        const profilePointer = new Profile();
        profilePointer.id = author.id;

        const oneSignalPlayerIds = profilePointer.get('oneSignalPlayerIds');
        const currentUserName = await getCurrentUserName();

        if (oneSignalPlayerIds) {
          const { headings, contents } = messages.someoneLikedPost({
            person: currentUserName,
          });

          console.log('Sending liked post notification...');
          OneSignal.postNotification(
            JSON.stringify({
              include_player_ids: oneSignalPlayerIds,
              headings,
              contents,
            }),
            (success) => {
              console.log('[OneSignal]: Successfully sent message:', success);
            },
            (error) => {
              console.error('[OneSignal]: Failed to send message:', error);
            },
          );
        }
      }

      // dispatch(actions.updateLikedPosts(???));
      console.log(`Successfully ${!oldHasLiked ? 'liked' : 'unliked'} post`);
    } catch (error) {
      setHasLiked(oldHasLiked);
      setLikesCount(oldLikesCount);

      Alert.alert('Sorry, something went wrong. Please try again later.');
      console.error(
        `Failed to ${!oldHasLiked ? 'like' : 'unlike'} post: ${error}`,
      );
    }

    setIsProcessingLike(false);
  };

  const handlePressSave = async () => {
    const oldHasSaved = hasSaved;
    setIsProcessingSave(true);

    try {
      await onPressSave(!oldHasSaved, setHasSaved);
    } catch (error) {
      setHasSaved(oldHasSaved);
      Alert.alert('Sorry, something went wrong. Please try again later.');
      console.error(
        `Failed to ${!oldHasSaved ? 'save' : 'unsave'} post: ${error}`,
      );
    }

    setIsProcessingSave(false);
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
            source={avatarSource}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              postItemFooterStyles.authorName,
              { fontSize: authorFontSize },
            ]}>
            {author.name && !(author.length < 0) ? author.name : 'Anonymous'}
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
              name={hasSaved ? 'bookmark' : 'bookmark-outline'}
              color={hasSaved ? colors.black : colors.gray}
              size={actionIconSize}
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isProcessingLike}
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={handlePressLike}>
            <Animatable.View key={hasLiked.toString()} animation="bounceIn">
              <MaterialIcon
                style={postItemFooterStyles.actionButton}
                name={hasLiked ? 'favorite' : 'favorite-border'}
                color={hasLiked ? 'red' : colors.gray}
                size={actionIconSize}
              />
            </Animatable.View>
          </TouchableOpacity>
          <Text style={postItemFooterStyles.likesCount}>
            {likesCount > 999
              ? `${(likesCount / 1000).toFixed(1)}k`
              : likesCount}
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
  id: PropTypes.any.isRequired,
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes,
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
    flex: 1,
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

const PostItem = ({
  id,
  kind,
  text,
  author,
  metrics = { likesCount: 0, isLiked: false, isSaved: false },
  column = 0,
  imagePreview = {},
  imagePreviewDimensions = { width: 1, height: 1 },
  onPressPost = () => {},
  onPressSave = () => {},
  displayFooter = true,
  footerOptions = {
    largeIcons: false,
    showActions: true,
    showShareIcon: false,
  },
  ...props
}) => {
  const PostItemContent = ({ onPressPost, ...props }) => {
    const PostItemContentCaption = ({ text, maxWidth }) => {
      return (
        <Text
          style={{
            maxWidth,
            fontWeight: '600',
            fontSize: typography.size.xs,
            marginTop: values.spacing.sm,
            marginHorizontal: values.spacing.xs * 0.5,
            color: colors.gray700,
          }}
          numberOfLines={2}
          ellipsizeMode="tail">
          {text}
        </Text>
      );
    };

    const [isImageLoaded, setIsImageLoaded] = React.useState(false);
    const onImageLoad = (loadEvent) => {
      if (loadEvent) setIsImageLoaded(true);
    };

    switch (kind) {
      case PostItemKind.TEXT:
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
              {text.trim()}
            </Text>
          </View>
        );
      case PostItemKind.VIDEO /* FALLTHROUGH */:
        console.warn(
          '`PostItemKind.VIDEO` has been deprecated.',
          'Defaulting to `PostItemKind.MEDIA`...',
        );
      case PostItemKind.MEDIA:
        const { width, height } = imagePreviewDimensions;
        return (
          <View style={[props.style]}>
            <Image
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
            <PostItemContentCaption maxWidth={width} text={text} />
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
        },
        props.style,
      ]}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={onPressPost}>
        <PostItemContent onPressPost={onPressPost} />
      </TouchableOpacity>
      {displayFooter && (
        <PostItemFooter
          id={id}
          author={author}
          metrics={metrics}
          options={footerOptions}
          onPressSave={onPressSave}
        />
      )}
    </View>
  );
};

PostItem.propTypes = {
  id: PropTypes.any.isRequired,
  kind: PropTypes.oneOf(Object.values(PostItemKind)).isRequired,
  text: PropTypes.string.isRequired, // All posts require some form of text
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes,
  column: PropTypes.number,
  imagePreview: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  imagePreviewDimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }),
  onPressPost: PropTypes.func,
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
