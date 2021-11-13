import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';

import * as yup from 'yup';
import * as RNFS from 'react-native-fs';
import { Formik, useFormikContext } from 'formik';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { nanoid } from '@reduxjs/toolkit';
import { Video } from 'react-native-image-crop-picker';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { useNavigationAlertUnsavedChangesOnRemove } from 'src/hooks';
import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

import { LoadingOverlay } from 'src/components';
import { MediaSource } from 'src/api';

import { TextArea, VideoPreviewPicker } from './components';
import { useHandleSubmitNavigationButton } from './hooks';

const MAX_MEDIA_COUNT = 1;
const MAX_CAPTION_LENGTH = 280;
const GIF_SCALE_WIDTH = 150;

type CreateVideoPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateVideoPost'>;

const videoPostSchema = yup.object({
  video: yup
    .array()
    .required()
    .min(1, 'Please upload a video')
    .max(MAX_MEDIA_COUNT, 'You can only upload one video at a time'),
  caption: yup
    .string()
    .trim()
    .required('Please write a caption of at least 3 words')
    .max(MAX_CAPTION_LENGTH, 'Your caption is too long!')
    .test('has at least 3 words', 'Please enter at least 3 words', input => {
      if (!input) return false;
      return utilities.getWordCount(input) >= 3;
    }),
});

type VideoPostForm = Omit<yup.InferType<typeof videoPostSchema>, 'video'> & {
  video: Video[];
};

async function generateThumbnailPreview(video: Video): Promise<MediaSource> {
  // Prefer higher quality source URL (only available on iOS)
  const input = video.sourceURL ?? video.path;

  // We're using nanoid here to always generate a unique filename. We could use
  // the filename from `input` instead, which would prevent new files from being
  // created if we've already generated a preview for that particular video, but
  // `PostItemCard.Preview` uses FastImage to display the thumbnail, which
  // caches the image if the URI hasn't changed. Additionally, React Native's
  // Image component won't render GIFs on Android for some reason.
  const filename = `${nanoid()}.gif`;
  const outputDirectory = utilities.getThumbnailOutputDirectory();
  const output = `${outputDirectory}/${filename}`;

  if (!(await RNFS.exists(outputDirectory))) {
    console.log("Creating 'thumbnails' folder...");
    await RNFS.mkdir(outputDirectory);
  }

  // We'll overwrite the existing file for now
  console.log(`Generating GIF preview for file '${filename}'...`);
  const command = `-y -t 1 -i "${input}" -filter_complex "reverse[r];[0][r]concat=n=2:v=1:a=0,fps=25,scale=${GIF_SCALE_WIDTH}:trunc(ow/a/2)*2,crop=${GIF_SCALE_WIDTH}:min(in_h\\,${GIF_SCALE_WIDTH}/2*3)" "${output}"`;

  return await new Promise((resolve, reject) => {
    console.log('Running FFmpeg command:', command);
    FFmpegKit.executeAsync(command, async session => {
      const returnCode = await session.getReturnCode();
      const duration = await session.getDuration();

      if (!ReturnCode.isSuccess(returnCode)) {
        if (ReturnCode.isCancel(returnCode)) {
          console.warn('FFmpeg task cancelled!');
        } else {
          console.error(
            'Failed to generate thumbnail with return code:',
            returnCode,
          );
        }

        reject(returnCode);
      }

      console.log(`Successfully generated thumbnail in ${duration} ms.`);
      console.log('Getting media information...');

      const outputURI = `file://${output}`;
      const mediaSource = await utilities.getMediaSourceForFile(outputURI);
      resolve({ mime: 'image/gif', ...mediaSource });
    });
  });
}

export default function CreateVideoPostScreen(
  props: CreateVideoPostScreenProps,
) {
  const [generatingPreview, setGeneratingPreview] = React.useState(false);

  const handleNavigateToPreview = async (values: VideoPostForm) => {
    try {
      setGeneratingPreview(true);
      const video = values.video[0];
      const thumbnail = await generateThumbnailPreview(video);
      const source = utilities.mapVideoToMediaSource(video);
      props.navigation
        .getParent<CreateItemStackNavigationProp>()
        .navigate('CreateItemPreview', {
          type: 'post',
          contents: {
            type: 'video',
            caption: values.caption.trim(),
            source,
            thumbnail,
          },
        });
    } catch (error: any) {
      if (!ReturnCode.isCancel(error)) {
        utilities.alertSomethingWentWrong();
      }
    } finally {
      setGeneratingPreview(false);
    }
  };

  return (
    <>
      <Formik<VideoPostForm>
        initialValues={{ video: [], caption: '' }}
        validationSchema={videoPostSchema}
        onSubmit={async (values, helpers) => {
          await handleNavigateToPreview(values);
          helpers.resetForm({ values });
        }}>
        <VideoPostFormikForm />
      </Formik>
      {generatingPreview && <LoadingOverlay message="Generating preview…" />}
    </>
  );
}

function VideoPostFormikForm() {
  const { dirty, isSubmitting } = useFormikContext<VideoPostForm>();

  useNavigationAlertUnsavedChangesOnRemove(dirty);
  useHandleSubmitNavigationButton<VideoPostForm>();

  // FIXME: Get this to work properly with KeyboardAvoidingView
  return (
    <ScrollView contentContainerStyle={videoPostFormikFormStyles.scrollView}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'position' })}
        keyboardVerticalOffset={Platform.select({ ios: 40 })}
        style={{ flexGrow: 1 }}>
        <VideoPreviewPicker
          fieldName="video"
          maxCount={1}
          caption="Upload your video below"
          paused={isSubmitting}
        />
        <TextArea
          fieldName="caption"
          placeholder="Write a caption…"
          maxLength={MAX_CAPTION_LENGTH}
          containerStyle={[
            videoPostFormikFormStyles.container,
            { flexGrow: 1 },
          ]}
        />
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const videoPostFormikFormStyles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    paddingVertical: constants.layout.spacing.lg,
  },
  container: {
    paddingHorizontal: constants.layout.spacing.lg,
  },
});
