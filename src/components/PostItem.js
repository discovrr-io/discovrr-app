import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { colors, typography, values } from '../constants';

const imagePlaceholder = require('../../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../../resources/images/defaultAvatar.jpeg');

export const PostItemKind = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
};

const AuthorPropTypes = PropTypes.shape({
  avatar: PropTypes.shape({ url: PropTypes.string.isRequired }),
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
  author,
  metrics,
  onPressAvatar,
  onPressSave,
  onPressLike,
}) => {
  return (
    <View style={postItemFooterStyles.container}>
      <TouchableOpacity onPress={onPressAvatar}>
        <View style={postItemFooterStyles.authorContainer}>
          <Image
            style={postItemFooterStyles.avatar}
            source={author.avatar ?? defaultAvatar}
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
        <MaterialIcon
          style={postItemFooterStyles.actionButton}
          name={metrics.hasLiked ? 'favorite' : 'favorite-border'}
          color={metrics.hasLiked ? 'red' : colors.gray}
          size={ACTION_BUTTON_SIZE}
          onPress={onPressLike}
        />
        <Text style={postItemFooterStyles.likesCount}>
          {metrics.likesCount}
        </Text>
      </View>
    </View>
  );
};

PostItemFooter.propTypes = {
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes.isRequired,
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
    fontSize: typography.size.xs,
    marginLeft: values.spacing.sm * 1.5,
    color: colors.black,
    maxWidth: 80, // hard-coded for now
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: values.spacing.md,
  },
  likesCount: {
    marginLeft: values.spacing.zero,
    fontSize: typography.size.xs,
    alignSelf: 'flex-end',
  },
});

const PostItem = ({
  kind,
  text,
  author,
  metrics,
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
  const PostItemContent = (props) => {
    const PostItemContentCaption = ({ text, maxWidth }) => {
      return (
        <Text
          style={{
            maxWidth,
            fontWeight: '600',
            fontSize: typography.size.xs,
            marginTop: values.spacing.sm,
            marginHorizontal: values.spacing.sm,
            color: colors.darkGray,
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
          <View style={[postItemStyles.dialogBox, props.style]}>
            <Text
              numberOfLines={6}
              ellipsizeMode="tail"
              style={postItemStyles.dialogBoxText}>
              {text}
            </Text>
          </View>
        );
      case PostItemKind.IMAGE:
        const { width, height } = imagePreviewDimensions;
        return (
          <View style={[props.style]}>
            <Image
              onLoad={onImageLoad}
              source={isImageLoaded ? imagePreview : imagePlaceholder}
              style={{
                width,
                height,
                resizeMode: 'contain',
                borderRadius: values.radius.md,
              }}
            />
            <PostItemContentCaption maxWidth={width} text={text} />
          </View>
        );
      case PostItemKind.VIDEO:
        return (
          <View style={[props.style]}>
            <PostItemContentCaption maxWidth={100} text={text} />
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
          marginLeft: values.spacing.sm,
          marginBottom: values.spacing.lg,
        },
        props.style,
      ]}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPressPost}>
        <PostItemContent />
      </TouchableOpacity>
      {displayFooter && (
        <PostItemFooter
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
  kind: PropTypes.oneOf(Object.values(PostItemKind)).isRequired,
  text: PropTypes.string.isRequired, // All posts require some form of text
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes.isRequired,
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
    backgroundColor: colors.lightGray,
    borderColor: colors.gray,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '600',
  },
});

export default PostItem;
