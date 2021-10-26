import * as React from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/core';
import ImageCropPicker, {
  Image,
  PickerErrorCode,
} from 'react-native-image-crop-picker';

import { Button, Card, Spacer } from 'src/components';
import { color, font, layout, values } from 'src/constants';
import { alertSomethingWentWrong } from 'src/utilities';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

const MAX_CAPTION_LENGTH = 280;

const galleyPostSchema = yup.object({
  media: yup.array().required().min(1, 'Please upload at least one photo.'),
  caption: yup
    .string()
    .trim()
    .required('Please write a caption of at least 3 words')
    .max(
      MAX_CAPTION_LENGTH,
      `Your caption is too long! Please enter at most ${MAX_CAPTION_LENGTH} characters`,
    )
    .test('has at least 3 words', 'Please enter at least 3 words', value => {
      if (!value) return false;
      return value.trim().split(/\s/).filter(Boolean).length >= 3;
    }),
});

type GalleryPostForm = Omit<yup.InferType<typeof galleyPostSchema>, 'media'> & {
  media: Image[];
};

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
      initialValues={{ media: [], caption: '' }}
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

  const [field, meta, _] = useField<GalleryPostForm['caption']>('caption');

  useFocusEffect(
    React.useCallback(() => {
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
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}>
      <KeyboardAvoidingView behavior="position" style={{ flexGrow: 1 }}>
        <View
          style={[
            galleryPostFormikFormStyles.container,
            { paddingTop: layout.spacing.lg },
          ]}>
          <Text style={[font.medium, { color: color.gray500 }]}>
            Start creating your gallery post by uploading your photos below:
          </Text>
        </View>
        <ImagePreviewPicker />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={[galleryPostFormikFormStyles.container, { flexGrow: 1 }]}>
            {meta.error && meta.touched && (
              <Text style={[font.smallBold, { color: color.danger }]}>
                {meta.error}
              </Text>
            )}
            <TextInput
              multiline
              numberOfLines={8}
              maxLength={MAX_CAPTION_LENGTH}
              placeholder="Write a caption…"
              placeholderTextColor={color.gray500}
              value={field.value}
              onChangeText={field.onChange('caption')}
              onBlur={field.onBlur('caption')}
              style={[font.extraLarge, { textAlignVertical: 'top' }]}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const galleryPostFormikFormStyles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.spacing.lg,
  },
});

function ImagePreviewPicker() {
  const $FUNC = '[ImagePreviewPicker]';
  const [_, meta, helpers] = useField<GalleryPostForm['media']>('media');
  const { width: windowWidth } = useWindowDimensions();

  const flatListRef = React.useRef<FlatList>(null);
  const imageItemWidth = React.useMemo(() => windowWidth / 2, [windowWidth]);

  const handleAddImages = async () => {
    try {
      const images = await ImageCropPicker.openPicker({
        cropping: true,
        mediaType: 'photo',
        multiple: true,
      });
      helpers.setValue([...meta.value, ...images]);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error: any) {
      if (error.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) {
        console.log($FUNC, 'User cancelled image picker');
        return;
      }

      console.error($FUNC, 'Failed to add images:', error);
      alertSomethingWentWrong(
        `We weren't able to add your photo. Please report the following error to the Discovrr development team:\n\n${
          error.code || error.message || JSON.stringify(error)
        }`,
      );
    }
  };

  const handleRemoveImageAtIndex = (index: number) => {
    const newImageArray = [
      ...meta.value.slice(0, index),
      ...meta.value.slice(index + 1),
    ];
    helpers.setValue(newImageArray);
  };

  return (
    <View style={{ paddingVertical: layout.spacing.sm }}>
      {meta.touched && meta.error && (
        <Text
          style={[
            font.smallBold,
            { color: color.danger, paddingHorizontal: layout.spacing.lg },
          ]}>
          {meta.error}
        </Text>
      )}
      <FlatList<Image>
        horizontal
        ref={flatListRef}
        data={meta.value}
        keyExtractor={(_, index) => `image-item-${index}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: layout.spacing.sm * 1.5,
          paddingVertical: layout.spacing.lg,
          justifyContent: 'center',
        }}
        ItemSeparatorComponent={() => <Spacer.Horizontal value="md" />}
        renderItem={({ item: imageItem, index }) => (
          <View>
            <TouchableOpacity
              activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
              onPress={() => handleRemoveImageAtIndex(index)}
              style={{ zIndex: 1 }}>
              <Card.Indicator
                iconName="close"
                elementOptions={{ smallContent: true }}
              />
            </TouchableOpacity>
            <FastImage
              source={{ uri: imageItem.path }}
              style={[imagePreviewPickerStyles.item, { width: imageItemWidth }]}
            />
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableHighlight
            underlayColor={color.gray100}
            onPress={handleAddImages}
            style={[
              imagePreviewPickerStyles.item,
              imagePreviewPickerStyles.addImage,
              { width: imageItemWidth },
            ]}>
            <Icon name="add-outline" color={color.accent} size={60} />
          </TouchableHighlight>
        )}
        ListFooterComponentStyle={{
          paddingLeft: meta.value.length > 0 ? layout.spacing.md : undefined,
        }}
      />
    </View>
  );
}

const imagePreviewPickerStyles = StyleSheet.create({
  item: {
    aspectRatio: 1,
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
