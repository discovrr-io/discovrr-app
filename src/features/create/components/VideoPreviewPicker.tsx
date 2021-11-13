import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  View,
} from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import ImageCropPicker, { Video } from 'react-native-image-crop-picker';
import RNVideo, {
  OnLoadData,
  VideoProperties as RNVideoProps,
} from 'react-native-video';
import { useField } from 'formik';
import { useFocusEffect } from '@react-navigation/core';

import * as utilities from 'src/utilities';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';
import { color, layout } from 'src/constants';

import PreviewPicker, { PreviewPickerProps } from './PreviewPicker';

const MAXIMUM_DURATION_SECONDS = 60;
const MAXIMUM_DURATION_MILLISECONDS = MAXIMUM_DURATION_SECONDS * 1000;

// const command = `-i ${video.path} -loop -1 -vf "scale=320:-1" ${outputPath}`;

export type VideoPreviewPickerProps = Pick<
  PreviewPickerProps<Video>,
  'fieldName' | 'maxCount' | 'caption' | 'description'
> & {
  maxTimeLimit?: number;
  paused?: boolean;
};

export default function ViewPreviewPicker(props: VideoPreviewPickerProps) {
  const [_field, meta, helpers] = useField<Video[]>(props.fieldName);

  const previewPickerRef = React.useRef<PreviewPicker>(null);
  const videoPlayerRef = React.useRef<RNVideo>(null);
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
        // iconName="film-outline"
        description={
          props.description ??
          `Tap on ${
            props.maxCount > 1 ? 'a' : 'the'
          } video to play it in fullscreen`
        }
        onAddItem={handleAddVideo}
        onSelectItemAtIndex={handlePlayVideoOnFullScreen}
        renderItem={renderItemInfo => (
          <VideoPreviewPickerItem
            ref={videoPlayerRef}
            paused={props.paused}
            {...renderItemInfo}
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

type VideoPreviewPickerItemProps = Omit<RNVideoProps, 'source'> & {
  item: Video;
  itemWidth: number;
};

const VideoPreviewPickerItem = React.forwardRef<
  RNVideo,
  VideoPreviewPickerItemProps
>((props, ref) => {
  const { item, itemWidth, onLoad, ...videoProps } = props;

  const [shouldPauseVideo, setShouldPauseVideo] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleOnLoad = React.useCallback(
    (data: OnLoadData) => {
      onLoad?.(data);
      setIsLoading(false);
    },
    [onLoad],
  );

  useFocusEffect(
    React.useCallback(() => {
      return () => setShouldPauseVideo(true);
    }, []),
  );

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <RNVideo
        ref={ref}
        repeat
        resizeMode="cover"
        paused={props.paused || shouldPauseVideo}
        source={{ uri: item.sourceURL ?? item.path }}
        onLoad={handleOnLoad}
        {...videoProps}
        style={{
          width: itemWidth,
          aspectRatio: 1,
          borderRadius: layout.radius.md,
          overflow: 'hidden',
          backgroundColor: color.placeholder,
        }}
      />
      {isLoading && (
        <ActivityIndicator
          size="large"
          color={color.gray500}
          style={{ position: 'absolute', transform: [{ scale: 1.5 }] }}
        />
      )}
    </View>
  );
});
