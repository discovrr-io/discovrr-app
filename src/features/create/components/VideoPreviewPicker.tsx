import * as React from 'react';
import { Alert, Keyboard, Platform, View } from 'react-native';

import { useField } from 'formik';
import BottomSheet from '@gorhom/bottom-sheet';
import ImageCropPicker, { Video } from 'react-native-image-crop-picker';
import VideoPlayer from 'react-native-video';

import * as utilities from 'src/utilities';
import { color, layout } from 'src/constants';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';

import PreviewPicker, { PreviewPickerProps } from './PreviewPicker';

const MAXIMUM_DURATION_SECONDS = 60;
const MAXIMUM_DURATION_MILLISECONDS = MAXIMUM_DURATION_SECONDS * 1000;

// const command = `-i ${video.path} -loop -1 -vf "scale=320:-1" ${outputPath}`;

export type VideoPreviewPickerProps = Pick<
  PreviewPickerProps<Video>,
  'fieldName' | 'maxCount' | 'caption' | 'description'
> & {
  maxTimeLimit?: number;
};

export default function ViewPreviewPicker(props: VideoPreviewPickerProps) {
  const [_field, meta, helpers] = useField<Video[]>(props.fieldName);

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
    if (Platform.OS === 'android') {
      // FIXME: The full screen video player doesn't work properly on Android
      utilities.alertUnavailableFeature();
      return;
    }

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
        if (props.maxCount > 1) {
          const selectedVideos = await ImageCropPicker.openPicker({
            mediaType: 'video',
            multiple: true,
            maxFiles: props.maxCount,
          });

          if (
            selectedVideos.some(
              video =>
                video.duration &&
                video.duration > MAXIMUM_DURATION_MILLISECONDS,
            )
          ) {
            Alert.alert(
              'Video Will Be Trimmed',
              'One or more of your videos are longer than the maximum time ' +
                `limit of ${MAXIMUM_DURATION_SECONDS} seconds. It will be ` +
                'trimmed when you upload it.',
            );
          }

          helpers.setValue([...meta.value, ...selectedVideos]);
        } else {
          const selectedVideo = await ImageCropPicker.openPicker({
            mediaType: 'video',
            multiple: false,
            maxFiles: 1,
          });

          console.log(selectedVideo);

          if (
            selectedVideo.duration &&
            selectedVideo.duration > MAXIMUM_DURATION_MILLISECONDS
          ) {
            Alert.alert(
              'Video Will Be Trimmed',
              'This video is longer than the maximum time limit of ' +
                `${MAXIMUM_DURATION_SECONDS} seconds. It will be trimmed ` +
                'when you upload it.',
            );
          }

          helpers.setValue([selectedVideo]);
        }

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
        {...props}
        ref={previewPickerRef}
        description={
          props.description ??
          `Tap on ${
            props.maxCount > 1 ? 'a' : 'the'
          } video to play it in fullscreen`
        }
        onAddItem={handleAddVideo}
        onSelectItemAtIndex={handlePlayVideoOnFullScreen}
        renderItem={({ item, itemWidth }) => (
          <VideoPlayer
            repeat
            ref={videoPlayerRef}
            source={{ uri: item.path }}
            resizeMode="cover"
            style={[
              {
                width: itemWidth,
                aspectRatio: 1,
                borderRadius: layout.radius.md,
                overflow: 'hidden',
                backgroundColor: color.placeholder,
              },
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
