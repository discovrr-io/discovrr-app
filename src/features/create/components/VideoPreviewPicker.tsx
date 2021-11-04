import * as React from 'react';
import { Keyboard, View } from 'react-native';

import { useField } from 'formik';
import BottomSheet from '@gorhom/bottom-sheet';
import ImageCropPicker, { Video } from 'react-native-image-crop-picker';
import VideoPlayer from 'react-native-video';

import * as utilities from 'src/utilities';
import { color } from 'src/constants';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';

import PreviewPicker, { PreviewPickerProps } from './PreviewPicker';

export type VideoPreviewPickerProps = Pick<
  PreviewPickerProps<Video>,
  'fieldName' | 'maxCount' | 'caption'
>;

export default function ViewPreviewPicker(props: VideoPreviewPickerProps) {
  const [_, meta, helpers] = useField<Video[]>(props.fieldName);
  const { value: videos } = meta;

  const previewPickerRef = React.useRef<PreviewPicker>(null);
  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo(() => {
    return [
      { id: 'camera', label: 'Record a Video', iconName: 'videocam-outline' },
      {
        id: 'library',
        label: 'Select from Photo Library',
        iconName: 'albums-outline',
      },
    ] as ActionBottomSheetItem[];
  }, []);

  const handleAddVideo = async () => {
    Keyboard.dismiss();
    actionBottomSheetRef.current?.expand();
  };

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleRecordVideo = async () => {
      try {
        await ImageCropPicker.openCamera({
          mediaType: 'video',
        });
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    const handleSelectFromPhotoLibrary = async () => {
      try {
        await ImageCropPicker.openPicker({
          mediaType: 'video',
        });
      } catch (error) {
        utilities.alertImageCropPickerError(error);
      }
    };

    switch (selectedItemId) {
      case 'camera':
        // We'll wait a short period of time to let the bottom sheet fully close
        setTimeout(async () => {
          await handleRecordVideo();
        }, 80);
        break;
      case 'library':
        // We'll wait a short period of time to let the bottom sheet fully close
        setTimeout(async () => {
          await handleSelectFromPhotoLibrary();
        }, 80);
        break;
    }
  };

  return (
    <View>
      <PreviewPicker<Video>
        ref={previewPickerRef}
        fieldName={props.fieldName}
        maxCount={props.maxCount}
        caption={props.caption}
        onAddItem={handleAddVideo}
        renderItem={({ item, itemWidth }) => (
          <VideoPlayer
            paused
            source={{ uri: item.path }}
            style={{
              width: itemWidth,
              aspectRatio: 1,
              backgroundColor: color.placeholder,
            }}
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
