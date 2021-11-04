import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import * as yup from 'yup';
import { Formik } from 'formik';

import { CreateItemDetailsTopTabScreenProps } from 'src/navigation';
import { layout } from 'src/constants';
import { VideoPreviewPicker } from './components';

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
  // useFocusEffect(
  //   React.useCallback(() => {
  //     return () => {
  //       FFmpegKit.cancel()
  //         .then(() => console.log('Successfully cancelled'))
  //         .catch(error => console.error('Failed to cancel:', error));
  //     };
  //   }, []),
  // );

  return (
    <Formik<VideoPostForm>
      initialValues={{ video: [] }}
      onSubmit={values => console.log(values)}>
      <VideoPostFormikForm />
    </Formik>
  );
}

function VideoPostFormikForm() {
  return (
    <ScrollView contentContainerStyle={videoPostFormikFormStyles.scrollView}>
      <VideoPreviewPicker
        fieldName="video"
        maxCount={1}
        caption="Upload your video below"
      />
    </ScrollView>
  );
}

const videoPostFormikFormStyles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    paddingVertical: layout.spacing.lg,
  },
  container: {
    paddingHorizontal: layout.spacing.lg,
  },
});

/*
function VideoPostFormikForm() {
  const [video, setVideo] = React.useState<Video>();
  const [gifDir, setGifDir] = React.useState<string>();

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
      const fileId = nanoid();
      console.log('CACHE DIR:', RNFS.CachesDirectoryPath);
      console.log('Encoding video...');

      const outputPath = `${RNFS.CachesDirectoryPath}/${fileId}.gif`;
      const command = `-i ${video.path} -loop -1 -vf "scale=320:-1" ${outputPath}`;
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
          const gifPath = `file://${outputPath}`;
          console.log('OUTPUT:', gifPath);
          setGifDir(gifPath);
        } else if (ReturnCode.isCancel(returnCode)) {
          console.warn('FFmpeg task cancelled!');
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
      {video && (
        <View>
          <VideoPlayer
            repeat
            controls
            source={{ uri: video.path }}
            style={{
              backgroundColor: 'lightblue',
              width: '100%',
              aspectRatio: 1,
            }}
          />
          <Text>{JSON.stringify(video)}</Text>
        </View>
      )}
      <Button
        title={!video ? 'Select Video' : 'Encode Video'}
        type="primary"
        variant="contained"
        onPress={async () => {
          if (!video) return await handleSelectVideo();
          return await handleEncodeVideo(video);
        }}
      />
      {gifDir && (
        <FastImage
          source={{ uri: gifDir }}
          style={{
            backgroundColor: 'lightgreen',
            width: '100%',
            aspectRatio: 1,
          }}
        />
      )}
    </ScrollView>
  );
}
*/
