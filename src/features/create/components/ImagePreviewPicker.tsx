import * as React from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  StyleProp,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableOpacityProps,
  useWindowDimensions,
  View,
} from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import FastImage, { ImageStyle } from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useField } from 'formik';

import ImageCropPicker, {
  Image,
  PickerErrorCode,
} from 'react-native-image-crop-picker';

import * as utilities from 'src/utilities';
import { color, font, layout, values } from 'src/constants';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  Spacer,
} from 'src/components';

const IMAGE_COMPRESSION_QUALITY = 0.7;
const IMAGE_COMPRESSION_MAX_WIDTH = 550;
const IMAGE_COMPRESSION_MAX_HEIGHT = (IMAGE_COMPRESSION_MAX_WIDTH / 2) * 3;

export type ImagePreviewPickerProps = {
  fieldName: string;
  maxCount: number;
};

export function ImagePreviewPicker(props: ImagePreviewPickerProps) {
  const $FUNC = '[ImagePreviewPicker]';
  const [_, meta, helpers] = useField<Image[]>(props.fieldName);

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

  const handleAddImage = () => {
    Keyboard.dismiss();
    actionBottomSheetRef.current?.expand();
  };

  const handlePressImageAtIndex = async (index: number) => {
    try {
      if (index < 0 || index >= meta.value.length) {
        console.warn($FUNC, 'Invalid index:', index);
        return;
      }

      const image = await ImageCropPicker.openCropper({
        mediaType: 'photo',
        path: meta.value[index].path,
        // path: Platform.select({
        //   // Prefer sourceURL as that is the original high-quality image path
        //   ios: meta.value[index].sourceURL ?? meta.value[index].path,
        //   default: meta.value[index].path,
        // }),
        compressImageQuality: IMAGE_COMPRESSION_QUALITY,
        compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
        compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
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
    } catch (error: any) {
      if (error.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
      const { title, message } =
        utilities.constructAlertFromImageCropPickerError(error);
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
          forceJpg: true,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
        });

        helpers.setValue([...meta.value, image]);
        helpers.setTouched(true, true);
        flatListRef.current?.scrollToEnd({ animated: true });
      } catch (error: any) {
        if (error.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
        const { title, message } =
          utilities.constructAlertFromImageCropPickerError(error);
        Alert.alert(title, message);
      }
    };

    const handleSelectFromPhotoLibrary = async () => {
      try {
        const images = await ImageCropPicker.openPicker({
          mediaType: 'photo',
          cropping: true,
          multiple: true,
          maxFiles: props.maxCount,
          forceJpg: true,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
        });

        helpers.setValue([...meta.value, ...images]);
        helpers.setTouched(true, true);
        flatListRef.current?.scrollToEnd({ animated: true });
      } catch (error: any) {
        if (error.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
        const { title, message } =
          utilities.constructAlertFromImageCropPickerError(error);
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
          getItemLayout={(_, index) => {
            const itemLength = imageItemWidth + layout.spacing.md;
            return { index, length: itemLength, offset: itemLength * index };
          }}
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
              isAboveLimit={index >= props.maxCount}
              onPressItem={() => handlePressImageAtIndex(index)}
              onPressRemove={() => handleRemoveImageAtIndex(index)}
              style={{ width: imageItemWidth }}
            />
          )}
          ListFooterComponent={() => {
            if (meta.value.length >= props.maxCount) return null;
            return (
              <TouchableHighlight
                underlayColor={color.gray100}
                onPress={handleAddImage}
                style={[
                  imagePreviewPickerStyles.item,
                  imagePreviewPickerStyles.addImage,
                  { width: imageItemWidth },
                ]}>
                <Icon name="add-outline" color={color.accent} size={60} />
              </TouchableHighlight>
            );
          }}
          ListFooterComponentStyle={{
            paddingLeft:
              meta.value.length > 0 && meta.value.length < props.maxCount
                ? layout.spacing.md
                : undefined,
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
  isAboveLimit?: boolean;
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
        hitSlop={{ top: 30, right: 30, bottom: 30, left: 30 }}
        style={imagePreviewPickerStyles.removeIconContainer}>
        <Icon name="close" size={24} color={color.white} />
      </TouchableOpacity>
      <FastImage
        source={{ uri: props.item.path }}
        style={[
          imagePreviewPickerStyles.item,
          { width: itemWidth, backgroundColor: color.placeholder },
          props.isAboveLimit && { opacity: 0.25 },
          props.style,
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
