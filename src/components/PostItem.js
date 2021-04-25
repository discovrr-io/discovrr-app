import React from 'react';
import PropTypes from 'prop-types';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, values } from '../constants';

export const PostItemKind = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
};

const AuthorPropTypes = PropTypes.shape({
  avatar: PropTypes.string,
  name: PropTypes.string.isRequired,
});

const MetricsPropTypes = PropTypes.shape({
  likes: PropTypes.number.isRequired,
  isLiked: PropTypes.bool.isRequired,
  isSaved: PropTypes.bool.isRequired,
});

const PostItemFooter = ({ author, metrics }) => {
  return (
    <View style={postItemFooterStyles.container}>
      <Image
        style={postItemFooterStyles.avatar}
        source={{ url: author.avatar }}
      />
      <Text style={postItemFooterStyles.authorName}>{author.name}</Text>
    </View>
  );
};

PostItemFooter.propTypes = {
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes.isRequired,
};

const avatarRadius = 35;

const postItemFooterStyles = StyleSheet.create({
  container: {
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
  },
});

const PostItem = ({
  kind,
  text,
  imagePreview,
  imageHeight,
  author,
  metrics,
  ...props
}) => {
  const PostItemContent = (props) => {
    switch (kind) {
      case PostItemKind.TEXT:
        return (
          <Text
            numberOfLines={4}
            ellipsizeMode="tail"
            style={[postItemStyles.dialogBox, props.style]}>
            {text}
          </Text>
        );
      case PostItemKind.IMAGE:
        return (
          <Image
            style={[
              {
                height: imageHeight,
                width: '100%',
              },
              props.style,
            ]}
            source={imagePreview}
          />
        );
      case PostItemKind.VIDEO:
        return <Text>VIDEO</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={[props.style]}>
      <PostItemContent style={{ marginBottom: values.spacing.md }} />
      <PostItemFooter author={author} metrics={metrics} />
    </View>
  );
};

PostItem.propTypes = {
  kind: PropTypes.oneOf(Object.values(PostItemKind)).isRequired,
  text: PropTypes.string.isRequired, // All posts require some form of text
  imagePreview: PropTypes.object,
  imageHeight: PropTypes.number,
  author: AuthorPropTypes.isRequired,
  metrics: MetricsPropTypes.isRequired,
};

const postItemStyles = StyleSheet.create({
  dialogBox: {
    backgroundColor: colors.lightGray,
    borderColor: colors.gray,
    borderRadius: values.radius.md,
    borderWidth: values.border.thin,
    color: colors.black,
    fontWeight: '600',
    padding: values.spacing.md,
  },
});

export default PostItem;
