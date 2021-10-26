import * as React from 'react';
import {
  Alert,
  FlatList,
  ImageStyle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  TouchableOpacityProps,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';

import BottomSheet from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/core';
import ImageCropPicker, {
  Image,
  PickerErrorCode,
} from 'react-native-image-crop-picker';

import * as utilities from 'src/utilities';
import { color, font, layout, strings, values } from 'src/constants';
import { useNavigationAlertUnsavedChangesOnRemove } from 'src/hooks';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  Button,
  Spacer,
} from 'src/components';

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
    .test('has at least 3 words', 'Please enter at least 3 words', input => {
      if (!input) return false;
      return utilities.getWordCount(input) >= 3;
    }),
});

function constructAlertFromImageCropPickerError(error: any): {
  title: string;
  message: string;
} {
  let title: string;
  let message: string;

  switch (error.code as PickerErrorCode) {
    case 'E_NO_LIBRARY_PERMISSION':
      title = 'No Library Permissions';
      message =
        "You haven't allowed Discovrr access to your photo library. Please enable this in Settings and try again.";
      break;
    case 'E_NO_CAMERA_PERMISSION':
      title = 'No Camera Permissions';
      message =
        "You haven't allowed Discovrr access to your camera. Please enable this in Settings and try again.";
    default:
      //  Also handles the case when error.code is undefined
      console.warn('Unhandled error:', error);
      title = strings.SOMETHING_WENT_WRONG.title;
      message = strings.SOMETHING_WENT_WRONG.message;
      break;
  }

  return { title, message };
}

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

  // React.useEffect(() => {
  //   return () => {
  //     console.log('Cleaning temporary images from image picker...');
  //     ImageCropPicker.clean()
  //       .then(() =>
  //         console.log(
  //           'Successfully cleaned temporary images from image picker',
  //         ),
  //       )
  //       .catch(error =>
  //         console.warn(
  //           'Failed to clean temporary files from image picker:',
  //           error,
  //         ),
  //       );
  //   };
  // }, []);

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

  const { dirty, handleSubmit } = useFormikContext<GalleryPostForm>();

  const [field, meta, _] = useField<GalleryPostForm['caption']>('caption');

  // FIXME: This will still show an alert if the user has switched tabs from a
  // dirty gallery form and then pressed the close button.
  useNavigationAlertUnsavedChangesOnRemove(dirty);

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
            Start creating your gallery post by uploading your photos below
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

  // React.useEffect(() => {
  //   console.log(meta.value);
  // }, [meta.value]);

  const flatListRef = React.useRef<FlatList>(null);
  const actionBottomSheetRef = React.useRef<BottomSheet>(null);

  const actionBottomSheetItems = React.useMemo(() => {
    return [
      { id: 'camera', label: 'Take a Photo', iconName: 'camera-outline' },
      {
        id: 'library',
        label: 'Select from Photo Library',
        iconName: 'albums-outline',
      },
    ] as ActionBottomSheetItem[];
  }, []);

  const { width: windowWidth } = useWindowDimensions();
  const imageItemWidth = React.useMemo(() => windowWidth / 2, [windowWidth]);

  const handlePressImageAtIndex = async (index: number) => {
    try {
      if (index < 0 || index >= meta.value.length) {
        console.warn($FUNC, 'Invalid index:', index);
        return;
      }

      const image = await ImageCropPicker.openCropper({
        mediaType: 'photo',
        path: Platform.select({
          // Prefer sourceURL as that is the original high-quality image path
          ios: meta.value[index].sourceURL ?? meta.value[index].path,
          default: meta.value[index].path,
        }),
      });

      console.log($FUNC, 'Setting new image:', image);
      const newImagesArray = [
        ...meta.value.slice(0, index),
        {
          ...image,
          width: image.cropRect?.width ?? image.width,
          height: image.cropRect?.height ?? image.height,
        } as Image,
        ...meta.value.slice(index + 1),
      ];
      helpers.setValue(newImagesArray);
    } catch (err: any) {
      if (err.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
      const { title, message } = constructAlertFromImageCropPickerError(err);
      Alert.alert(title, message);
    }
  };

  const handleRemoveImageAtIndex = (index: number) => {
    const newImageArray = [
      ...meta.value.slice(0, index),
      ...meta.value.slice(index + 1),
    ];
    helpers.setValue(newImageArray);
  };

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleTakePhoto = async () => {
      try {
        const image = await ImageCropPicker.openCamera({
          mediaType: 'photo',
          cropping: true,
        });
        console.log($FUNC, 'PHOTO:', image);
        helpers.setValue([...meta.value, image]);
        // flatListRef.current?.scrollToEnd({ animated: true });
        flatListRef.current?.scrollToIndex({
          animated: true,
          index: meta.value.length - 1,
        });
      } catch (err: any) {
        if (err.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
        const { title, message } = constructAlertFromImageCropPickerError(err);
        Alert.alert(title, message);
      }
    };

    const handleSelectFromPhotoLibrary = async () => {
      try {
        const images = await ImageCropPicker.openPicker({
          mediaType: 'photo',
          cropping: true,
          multiple: true,
        });
        helpers.setValue([...meta.value, ...images]);
        flatListRef.current?.scrollToEnd({ animated: true });
      } catch (err: any) {
        if (err.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
        const { title, message } = constructAlertFromImageCropPickerError(err);
        Alert.alert(title, message);
      }
    };

    switch (selectedItemId) {
      case 'camera':
        setTimeout(async () => {
          await handleTakePhoto();
        }, 80);
        break;
      case 'library':
        // We'll wait a short period of time to let the bottom sheet fully close
        setTimeout(async () => {
          await handleSelectFromPhotoLibrary();
        }, 80);
        break;
      default:
        actionBottomSheetRef.current?.close();
        break;
    }
  };

  return (
    <>
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
            paddingHorizontal: layout.spacing.lg,
            paddingVertical: layout.spacing.lg,
            justifyContent: 'center',
          }}
          ItemSeparatorComponent={() => <Spacer.Horizontal value="md" />}
          renderItem={({ item, index }) => (
            <ImagePickerItem
              item={item}
              onPressItem={() => handlePressImageAtIndex(index)}
              onPressRemove={() => handleRemoveImageAtIndex(index)}
              style={{ width: imageItemWidth }}
            />
          )}
          ListFooterComponent={() => (
            <TouchableHighlight
              underlayColor={color.gray100}
              // onPress={handleAddImages}
              onPress={() => actionBottomSheetRef.current?.expand()}
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
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
        onSelectItem={handleSelectActionItem}
      />
    </>
  );
}

type ImagePickerItemProps = {
  item: Image;
  onPressItem?: TouchableOpacityProps['onPress'];
  onPressRemove?: TouchableOpacityProps['onPress'];
  style?: StyleProp<ImageStyle>;
};

function ImagePickerItem(props: ImagePickerItemProps) {
  const { width: windowWidth } = useWindowDimensions();
  const itemWidth = React.useMemo(() => windowWidth / 2, [windowWidth]);

  return (
    <TouchableOpacity
      activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
      onPress={props.onPressItem}>
      <TouchableOpacity
        activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
        onPress={props.onPressRemove}
        style={imagePreviewPickerStyles.removeIconContainer}>
        <Icon name="close" size={24} color={color.white} />
      </TouchableOpacity>
      <FastImage
        source={{ uri: props.item.path }}
        style={[
          imagePreviewPickerStyles.item,
          { width: itemWidth, backgroundColor: color.placeholder },
        ]}
      />
    </TouchableOpacity>
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
  removeIconContainer: {
    zIndex: 10,
    position: 'absolute',
    top: layout.spacing.md,
    right: layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.xs,
    paddingHorizontal: layout.spacing.xs,
    borderRadius: layout.radius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
});