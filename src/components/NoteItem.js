import React from 'react';
import PropTypes from 'prop-types';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, typography, values } from '../constants';

const imagePlaceholder = require('../../resources/images/imagePlaceholder.png');

const NoteItem = ({
  id,
  title,
  imagePreview,
  imagePreviewDimensions,
  ...props
}) => {
  const { width, height } = imagePreviewDimensions;

  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const onImageLoad = (loadEvent) => {
    if (loadEvent) setIsImageLoaded(true);
  };

  return (
    <View
      style={[
        {
          borderWidth: 0,
          borderColor: 'red',
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
          resizeMode: 'contain',
          borderRadius: values.radius.md,
        }}
      />
      <Text
        style={{
          fontWeight: '600',
          fontSize: typography.size.xs,
          marginTop: values.spacing.sm,
          marginHorizontal: values.spacing.sm,
          color: colors.gray700,
        }}>
        {title}
      </Text>
    </View>
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
};

const noteItemStyles = StyleSheet.create({});

export default NoteItem;
