import * as React from 'react';
import { Keyboard, View } from 'react-native';

import { useField } from 'formik';
import { Video } from 'react-native-image-crop-picker';
import BottomSheet from '@gorhom/bottom-sheet';
import VideoPlayer from 'react-native-video';

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
      { id: 'video', label: 'Record a Video', iconName: 'videocam-outline' },
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
      />
    </View>
  );
}
