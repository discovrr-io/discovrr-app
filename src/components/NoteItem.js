import React from 'react';
import PropTypes from 'prop-types';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, typography, values } from '../constants';

const imagePlaceholder = require('../../resources/images/imagePlaceholder.png');

const DEFAULT_ACTIVE_OPACITY = 0.6;

const NoteItem = ({
  id,
  title,
  imagePreview,
  imagePreviewDimensions,
  onPressNote = () => {},
  ...props
}) => {
  const { width, height } = imagePreviewDimensions;

  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const onImageLoad = (loadEvent) => {
    if (loadEvent) setIsImageLoaded(true);
  };

  return (
    <TouchableOpacity
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      onPress={onPressNote}>
      <View
        style={[
          {
            maxWidth: imagePreviewDimensions.width,
            marginBottom: values.spacing.sm * 1.5,
          },
          props.style,
        ]}>
        <Image
          onLoad={onImageLoad}
          source={isImageLoaded ? imagePreview : imagePlaceholder}
          style={{
            width,
            height,
            resizeMode: 'cover',
            borderRadius: values.radius.md,
            borderWidth: 1,
            borderColor: colors.gray500,
          }}
        />
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            fontWeight: '700',
            fontSize: typography.size.xs,
            marginTop: values.spacing.sm,
            marginHorizontal: values.spacing.xs * 0.5,
            color: colors.gray700,
          }}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

NoteItem.propTypes = {
  id: PropTypes.any.isRequired,
  title: PropTypes.string.isRequired,
  imagePreview: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  imagePreviewDimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }),
  onPressNote: PropTypes.func,
};

const noteItemStyles = StyleSheet.create({});

export default NoteItem;
