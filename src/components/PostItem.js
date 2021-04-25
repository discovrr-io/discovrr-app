import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Image,
  ShadowPropTypesIOS,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { colors, typography, values } from '../constants';

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
        <Image style={postItemFooterStyles.avatar} source={author.avatar} />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={postItemFooterStyles.authorName}>
          {author.name}
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
    marginBottom: values.spacing.lg,
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
    marginLeft: values.spacing.md,
  },
  likesNumber: {
    marginLeft: values.spacing.xs,
  },
});

const PostItem = ({
  kind,
  text,
  author,
  metrics,
  imagePreview = {},
  imagePreviewDimensions = { width: 1, height: 1 },
  displayFooter = true,
  ...props
}) => {
  const PostItemContent = (props) => {
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
        const ratio = width / height;
        return (
          <View>
            <Image
              style={{
                width: width,
                aspectRatio: ratio,
                resizeMode: 'contain',
                borderRadius: values.radius.md,
              }}
              source={imagePreview}
            />
            <Text
              style={{
                maxWidth: width,
                fontWeight: '600',
                fontSize: typography.size.sm,
                marginTop: values.spacing.sm,
              }}
              numberOfLines={4}
              ellipsizeMode="tail">
              {text}
            </Text>
          </View>
        );
      case PostItemKind.VIDEO:
        return <Text>VIDEO</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={[{ paddingLeft: values.spacing.sm }, props.style]}>
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
  imagePreview: PropTypes.object,
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
    borderRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '600',
  },
});

export default PostItem;
