import React from 'react';
import PropTypes from 'prop-types';
import { Image, StyleSheet, Text, View } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { colors, typography, values } from '../constants';

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
  likes: PropTypes.number.isRequired,
  isLiked: PropTypes.bool.isRequired,
  isSaved: PropTypes.bool.isRequired,
});

const postItemIconSize = 26;
const actionButtonSize = postItemIconSize;
const avatarRadius = postItemIconSize;

const PostItemFooter = ({ author, metrics }) => {
  return (
    <View style={postItemFooterStyles.container}>
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
      <View style={postItemFooterStyles.actionsContainer}>
        <MaterialIcon
          style={postItemFooterStyles.actionButton}
          name={metrics.isSaved ? 'bookmark' : 'bookmark-outline'}
          color={metrics.isSaved ? colors.black : colors.gray}
          size={actionButtonSize}
        />
        <MaterialIcon
          style={postItemFooterStyles.actionButton}
          name={metrics.isLiked ? 'favorite' : 'favorite-border'}
          color={metrics.isLiked ? 'red' : colors.gray}
          size={actionButtonSize}
        />
        <Text style={postItemFooterStyles.likesNumber}>{metrics.likes}</Text>
      </View>
    </View>
  );
};

PostItemFooter.propTypes = {
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes.isRequired,
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
    width: avatarRadius,
    height: avatarRadius,
    borderRadius: avatarRadius / 2,
  },
  authorName: {
    marginLeft: values.spacing.md,
    color: colors.black,
    maxWidth: 250,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: values.spacing.xs,
  },
  likesNumber: {
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
            color: colors.darkGray,
          }}
          numberOfLines={2}
          ellipsizeMode="tail">
          {text}
        </Text>
      );
    };

    switch (kind) {
      case PostItemKind.TEXT:
        return (
          <View style={[postItemStyles.dialogBox, props.style]}>
            <Text
              numberOfLines={4}
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
              style={{
                width,
                height,
                resizeMode: 'contain',
                borderRadius: values.radius.md,
              }}
              source={imagePreview}
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
          // backgroundColor: 'red',
          // width: imagePreviewDimensions.width,
        },
        props.style,
      ]}>
      <PostItemContent />
      {displayFooter && <PostItemFooter author={author} metrics={metrics} />}
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
