import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { Formik, useField, useFormikContext } from 'formik';
import { useFocusEffect, useNavigation } from '@react-navigation/core';

import { Button, Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';
import { gray500 } from 'src/constants/color';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

const galleyPostSchema = yup.object({
  media: yup.array().required().min(1, 'Please upload at least one photo.'),
});

type GalleryPostForm = yup.InferType<typeof galleyPostSchema>;

type CreateGalleryPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateGalleryPost'>;

export default function CreateGalleryPostScreen(
  _: CreateGalleryPostScreenProps,
) {
  const handleNavigateToPreview = (values: GalleryPostForm) => {
    console.log('GALLERY POST:', values);
  };

  return (
    <Formik<GalleryPostForm>
      initialValues={{ media: [] }}
      validationSchema={galleyPostSchema}
      onSubmit={handleNavigateToPreview}>
      <GalleryPostFormikForm />
    </Formik>
  );
}

function GalleryPostFormikForm() {
  const navigation =
    useNavigation<CreateGalleryPostScreenProps['navigation']>();
  const { handleSubmit } = useFormikContext<GalleryPostForm>();

  useFocusEffect(
    useCallback(() => {
      navigation.getParent<CreateItemStackNavigationProp>().setOptions({
        headerRight: () => (
          <Button
            title="Next"
            type="primary"
            size="medium"
            onPress={handleSubmit}
          />
        ),
      });
    }, [navigation, handleSubmit]),
  );

  return (
    <View style={[layout.defaultScreenStyle, { flex: 1 }]}>
      <Text style={[font.mediumBold, { color: gray500 }]}>
        Start creating your gallery post by uploading your images below:
      </Text>
      <Spacer.Vertical value="xs" />
      <ImagePreviews />
    </View>
  );
}

function ImagePreviews() {
  const [_, meta, helpers] = useField<GalleryPostForm['media']>('media');

  const flatListRef = useRef<FlatList>(null);

  const handleAddImage = () => {
    helpers.setValue([...meta.value, meta.value.length]);
    flatListRef.current?.scrollToEnd();
  };

  return (
    <View>
      {meta.touched && meta.error && (
        <Text style={[font.smallBold, { color: color.danger }]}>
          {meta.error}
        </Text>
      )}
      <FlatList
        horizontal
        ref={flatListRef}
        data={meta.value}
        keyExtractor={(_, index) => `image-item-${index}`}
        contentContainerStyle={{ paddingVertical: layout.spacing.lg }}
        ItemSeparatorComponent={() => <Spacer.Horizontal value="md" />}
        renderItem={({ item }) => (
          <View style={[imagePreviewStyles.item, imagePreviewStyles.addImage]}>
            <Text style={[font.h3, { color: color.gray500 }]}>
              {JSON.stringify(item)}
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity
            onPress={handleAddImage}
            style={[imagePreviewStyles.item, imagePreviewStyles.addImage]}>
            <Icon name="add" color={color.accent} size={50} />
          </TouchableOpacity>
        )}
        ListFooterComponentStyle={{ paddingLeft: layout.spacing.md }}
      />
    </View>
  );
}

const imagePreviewStyles = StyleSheet.create({
  item: {
    width: 180,
    height: 180,
    borderRadius: layout.radius.md,
    overflow: 'hidden',
  },
  addImage: {
    borderColor: color.gray500,
    borderWidth: layout.border.thick,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
