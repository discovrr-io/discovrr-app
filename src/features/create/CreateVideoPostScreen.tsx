import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

import * as yup from 'yup';
import {
  FFmpegKit,
  FFmpegKitConfig,
  ReturnCode,
} from 'ffmpeg-kit-react-native';

import { CreateItemDetailsTopTabScreenProps } from 'src/navigation';

import { Formik } from 'formik';
import { Button } from 'src/components';
import { layout } from 'src/constants';
import ImageCropPicker, { Video } from 'react-native-image-crop-picker';
import VideoPlayer from 'react-native-video';

type CreateVideoPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateVideoPost'>;

const videoPostSchema = yup.object({
  video: yup
    .array()
    .min(1, 'Please upload a video')
    .max(1, 'You can only upload one video at a time'),
});

type VideoPostForm = yup.InferType<typeof videoPostSchema>;

export default function CreateVideoPostScreen(_: CreateVideoPostScreenProps) {
  return (
    <Formik<VideoPostForm>
      initialValues={{ video: [] }}
      onSubmit={values => console.log(values)}>
      <VideoPostFormikForm />
    </Formik>
  );
}

function VideoPostFormikForm() {
  const [video, setVideo] = React.useState<Video | null>(null);

  const handleSelectVideo = async () => {
    try {
      const video = await ImageCropPicker.openPicker({
        mediaType: 'video',
      });

      console.log(video);
      setVideo(video);
    } catch (error) {
      console.error('Failed to pick video:', error);
    }
  };

  const handleEncodeVideo = async (video: Video) => {
    try {
      console.log('Encoding video...');

      const command = `-i ${video.path} -loop -1 -vf "scale=320:-1" output.gif`;

      console.log('EXECUTING:', command);
      FFmpegKit.executeAsync(command, async session => {
        const state = FFmpegKitConfig.sessionStateToString(
          await session.getState(),
        );
        const returnCode = await session.getReturnCode();
        const failStackTrace = await session.getFailStackTrace();
        const duration = await session.getDuration();

        if (ReturnCode.isSuccess(returnCode)) {
          console.log(`Encoding completed successfully in ${duration} ms.`);
        } else {
          console.error(
            `Failed to encode video with state "${state}"`,
            `and return code "${returnCode}"`,
          );
          console.log(failStackTrace);
        }
      });
    } catch (error) {
      console.error('Failed to encode video:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={layout.defaultScreenStyle}>
      <Button
        title={!video ? 'Select Video' : 'Encode Video'}
        type="primary"
        variant="contained"
        onPress={async () => {
          if (!video) return await handleSelectVideo();
          return await handleEncodeVideo(video);
        }}
      />
      {video && (
        <View>
          <VideoPlayer
            source={{ uri: video.path }}
            style={{ backgroundColor: 'red', width: '100%', aspectRatio: 1 }}
          />
          <Text>{JSON.stringify(video)}</Text>
        </View>
      )}
    </ScrollView>
  );
}
