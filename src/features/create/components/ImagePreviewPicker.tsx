import * as React from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import ImageCropPicker, { Image } from 'react-native-image-crop-picker';
import { useField } from 'formik';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

import PreviewPicker, { PreviewPickerProps } from './PreviewPicker';

const IMAGE_COMPRESSION_QUALITY = 0.7;
const IMAGE_COMPRESSION_MAX_WIDTH = 550;
const IMAGE_COMPRESSION_MAX_HEIGHT = (IMAGE_COMPRESSION_MAX_WIDTH / 2) * 3;

export type ImagePreviewPickerProps = Pick<
  PreviewPickerProps<Image>,
  'fieldName' | 'maxCount' | 'caption' | 'description'
>;

export default function ImagePreviewPicker(props: ImagePreviewPickerProps) {
  const [_, meta, helpers] = useField<Image[]>(props.fieldName);
  const { value: images } = meta;
  const { colors } = useExtendedTheme();

  const previewPickerRef = React.useRef<PreviewPicker>(null);
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

  const handleAddImage = () => {
    Keyboard.dismiss();
    actionBottomSheetRef.current?.expand();
  };

  const handleSelectItemAtIndex = async (index: number) => {
    try {
      if (index < 0 || index >= images.length) {
        console.warn('Invalid index:', index);
        return;
      }

      const image = await ImageCropPicker.openCropper({
        mediaType: 'photo',
        path: images[index].path,
        // path: Platform.select({
        //   // Prefer sourceURL as that is the original high-quality image path
        //   ios: media[index].sourceURL ?? media[index].path,
        //   default: media[index].path,
        // }),
        // compressImageQuality: IMAGE_COMPRESSION_QUALITY,
        compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
        compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
      });

      console.log('Setting new image:', image);
      const newImagesArray = [
        ...images.slice(0, index),
        {
          ...image,
          width: image.cropRect?.width ?? image.width,
          height: image.cropRect?.height ?? image.height,
        } as Image,
        ...images.slice(index + 1),
      ];
      helpers.setValue(newImagesArray);
    } catch (error: any) {
      utilities.alertImageCropPickerError(error);
    }
  };

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleTakePhoto = async () => {
      try {
        const image = await ImageCropPicker.openCamera({
          mediaType: 'photo',
          // cropping: true,
          forceJpg: true,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
        });

        helpers.setValue([...images, image]);
        helpers.setTouched(true, true);
        previewPickerRef.current?.scrollToEnd();
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    const handleSelectFromPhotoLibrary = async () => {
      try {
        const newImages = await ImageCropPicker.openPicker({
          mediaType: 'photo',
          cropping: true,
          multiple: true,
          maxFiles: props.maxCount,
          forceJpg: true,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
        });

        helpers.setValue([...images, ...newImages]);
        helpers.setTouched(true, true);
        previewPickerRef.current?.scrollToEnd();
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    // We'll wait a short period of time to let the bottom sheet fully close
    setTimeout(async () => {
      switch (selectedItemId) {
        case 'camera':
          await handleTakePhoto();
          break;
        case 'library':
          await handleSelectFromPhotoLibrary();
          break;
      }
    }, constants.values.BOTTOM_SHEET_WAIT_DURATION);
  };

  return (
    <View>
      <PreviewPicker<Image>
        {...props}
        ref={previewPickerRef}
        description={
          props.description ??
          `Tap on ${props.maxCount > 1 ? 'a' : 'the'} photo to crop it`
        }
        onAddItem={handleAddImage}
        onSelectItemAtIndex={handleSelectItemAtIndex}
        renderItem={({ item, itemWidth, isAboveLimit }) => (
          <FastImage
            source={{ uri: item.path }}
            style={[
              imagePreviewPickerStyles.item,
              { width: itemWidth, backgroundColor: colors.placeholder },
              isAboveLimit && { opacity: 0.25 },
            ]}
          />
        )}
      />
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
        onSelectItem={handleSelectActionItem}
      />
    </View>
  );
}

const imagePreviewPickerStyles = StyleSheet.create({
  item: {
    aspectRatio: 1,
    borderRadius: constants.layout.radius.md,
    overflow: 'hidden',
  },
});
