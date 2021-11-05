import * as React from 'react';
import { Keyboard, View } from 'react-native';

import { useField } from 'formik';
import BottomSheet from '@gorhom/bottom-sheet';
import ImageCropPicker, { Video } from 'react-native-image-crop-picker';
import VideoPlayer from 'react-native-video';

import * as utilities from 'src/utilities';
import { color, layout } from 'src/constants';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';

import PreviewPicker, { PreviewPickerProps } from './PreviewPicker';

// const command = `-i ${video.path} -loop -1 -vf "scale=320:-1" ${outputPath}`;

export type VideoPreviewPickerProps = Pick<
  PreviewPickerProps<Video>,
  'fieldName' | 'maxCount' | 'caption'
>;

export default function ViewPreviewPicker(props: VideoPreviewPickerProps) {
  const [_field, _meta, helpers] = useField<Video[]>(props.fieldName);

  const previewPickerRef = React.useRef<PreviewPicker>(null);
  const videoPlayerRef = React.useRef<VideoPlayer>(null);
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

  const handlePlayVideoOnFullScreen = (_index: number) => {
    videoPlayerRef.current?.presentFullscreenPlayer();
  };

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleRecordVideo = async () => {
      try {
        utilities.alertUnavailableFeature();
        // await ImageCropPicker.openCamera({
        //   mediaType: 'video',
        // });
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    const handleSelectFromPhotoLibrary = async () => {
      try {
        const selectedVideo = await ImageCropPicker.openPicker({
          mediaType: 'video',
          maxFiles: props.maxCount,
        });

        helpers.setValue([selectedVideo]);
        helpers.setTouched(true, true);
        previewPickerRef.current?.scrollToEnd();
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
        onSelectItemAtIndex={handlePlayVideoOnFullScreen}
        renderItem={({ item, itemWidth }) => (
          <VideoPlayer
            // paused
            repeat
            ref={videoPlayerRef}
            source={{ uri: item.path }}
            resizeMode="cover"
            style={{
              width: itemWidth,
              aspectRatio: 1,
              backgroundColor: color.placeholder,
              borderRadius: layout.radius.md,
              overflow: 'hidden',
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
