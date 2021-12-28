import * as React from 'react';
import { ActivityIndicator, Keyboard, Platform, View } from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import ImageCropPicker, { Video } from 'react-native-image-crop-picker';
import { useField } from 'formik';
import { useFocusEffect } from '@react-navigation/core';

import RNVideo, {
  OnLoadData,
  VideoProperties as RNVideoProps,
} from 'react-native-video';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

import PreviewPicker, { PreviewPickerProps } from './PreviewPicker';

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
        const selectedVideo = await ImageCropPicker.openCamera({
          mediaType: 'video',
          multiple: false,
          maxFiles: 1,
        });

        utilities.alertIfAnyVideoWillBeTrimmed([selectedVideo]);
        helpers.setValue([selectedVideo]);
        helpers.setTouched(true, true);
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

          utilities.alertIfAnyVideoWillBeTrimmed(selectedVideos);
          helpers.setValue([...meta.value, ...selectedVideos]);
        } else {
          const selectedVideo = await ImageCropPicker.openPicker({
            mediaType: 'video',
            multiple: false,
            maxFiles: 1,
          });

          utilities.alertIfAnyVideoWillBeTrimmed([selectedVideo]);
          helpers.setValue([selectedVideo]);
        }

        helpers.setTouched(true, true);
        previewPickerRef.current?.scrollToEnd();
      } catch (error) {
        utilities.alertImageCropPickerError(error);
      }
    };

    // We'll wait a short period of time to let the bottom sheet fully close
    setTimeout(async () => {
      switch (selectedItemId) {
        case 'camera':
          await handleRecordVideo();
          break;
        case 'library':
          await handleSelectFromPhotoLibrary();
          break;
      }
    }, constants.values.BOTTOM_SHEET_WAIT_DURATION);
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
  const { colors } = useExtendedTheme();

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
          borderRadius: constants.layout.radius.md,
          overflow: 'hidden',
          backgroundColor: colors.placeholder,
        }}
      />
      {isLoading && (
        <ActivityIndicator
          size="large"
          color={constants.color.gray500}
          style={{ position: 'absolute', transform: [{ scale: 1.5 }] }}
        />
      )}
    </View>
  );
});
