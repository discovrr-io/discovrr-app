import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { colors, typography, values } from '../constants';

const imagePlaceholder = require('../../resources/images/imagePlaceholder.png');
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

const POST_ITEM_ICON_SIZE = 24;
const ACTION_BUTTON_SIZE = POST_ITEM_ICON_SIZE;
const AVATAR_DIAMETER = POST_ITEM_ICON_SIZE;

const PostItemFooter = ({
  id,
  author,
  metrics,
  onPressAvatar = () => {},
  onPressSave = () => {},
  onPressLike = () => {},
}) => {
  const hasLiked = useRef(metrics.hasLiked);
  const likesCount = useRef(metrics.likesCount);

  const avatarSource = author.avatar
    ? { uri: author.avatar.url }
    : defaultAvatar;

  const [isProcessingLike, setIsProcessingLike] = useState(false);

  const handleToggleLike = async () => {
    const prevHasLiked = hasLiked.current;
    const prevLikesCount = likesCount.current;
    setIsProcessingLike(true);

    try {
      hasLiked.current = !prevHasLiked;
      likesCount.current = Math.max(
        0,
        prevLikesCount + (hasLiked.current ? 1 : -1),
      );

      await Parse.Cloud.run('likeOrUnlikePost', {
        postId: id,
        like: hasLiked.current,
      });

      console.log(
        `Successfully ${hasLiked.current ? 'liked' : 'unliked'} post`,
      );
    } catch (error) {
      likesCount.current = prevLikesCount;
      hasLiked.current = prevHasLiked;

      Alert.alert('Sorry, something went wrong. Please try again later.');
      console.error(
        `Failed to ${!hasLiked.current ? 'liked' : 'unliked'} post: ${error}`,
      );
    }

    setIsProcessingLike(false);
  };

  return (
    <View style={postItemFooterStyles.container}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        style={{ flex: 1 }}
        onPress={onPressAvatar}>
        <View style={postItemFooterStyles.authorContainer}>
          <FastImage
            style={postItemFooterStyles.avatar}
            source={avatarSource}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={postItemFooterStyles.authorName}>
            {author.name && !(author.length < 0) ? author.name : 'Anonymous'}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={postItemFooterStyles.actionsContainer}>
        <MaterialIcon
          style={postItemFooterStyles.actionButton}
          name={metrics.hasSaved ? 'bookmark' : 'bookmark-outline'}
          color={metrics.hasSaved ? colors.black : colors.gray}
          size={ACTION_BUTTON_SIZE}
          onPress={onPressSave}
        />
        <TouchableOpacity
          disabled={isProcessingLike}
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={handleToggleLike}>
          <Animated.View animation="bounceIn">
            <MaterialIcon
              style={postItemFooterStyles.actionButton}
              name={hasLiked.current ? 'favorite' : 'favorite-border'}
              color={hasLiked.current ? 'red' : colors.gray}
              size={ACTION_BUTTON_SIZE}
            />
          </Animated.View>
        </TouchableOpacity>
        <Text style={postItemFooterStyles.likesCount}>
          {likesCount.current}
        </Text>
      </View>
    </View>
  );
};

PostItemFooter.propTypes = {
  id: PropTypes.any.isRequired,
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes,
  onPressAvatar: PropTypes.func,
  onPressSave: PropTypes.func,
  onPressLike: PropTypes.func,
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
  avatar: {
    width: AVATAR_DIAMETER,
    height: AVATAR_DIAMETER,
    borderRadius: AVATAR_DIAMETER / 2,
  },
  authorName: {
    flex: 1,
    fontSize: typography.size.xs,
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
  displayFooter = true,
  onPressPost = () => {},
  onPressAvatar = () => {},
  onPressSave = () => {},
  onPressLike = () => {},
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
            marginHorizontal: values.spacing.sm,
            color: colors.gray700,
          }}
          numberOfLines={2}
          ellipsizeMode="tail">
          {text}
        </Text>
      );
    };

    const [isImageLoaded, setIsImageLoaded] = useState(false);
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
              source={isImageLoaded ? imagePreview : imagePlaceholder}
              style={{
                width,
                height,
                resizeMode: 'cover',
                borderRadius: values.radius.md,
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
          onPressAvatar={onPressAvatar}
          onPressSave={onPressSave}
          onPressLike={onPressLike}
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
  displayFooter: PropTypes.bool,
  onPressPost: PropTypes.func,
  onPressAvatar: PropTypes.func,
  onPressSave: PropTypes.func,
  onPressLike: PropTypes.func,
};

const postItemStyles = StyleSheet.create({
  dialogBox: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderColor: colors.gray,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md,
    marginBottom: values.spacing.sm,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '700',
  },
});

export default PostItem;
