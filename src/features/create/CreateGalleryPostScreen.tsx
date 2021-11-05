import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useFormikContext } from 'formik';
import { Image } from 'react-native-image-crop-picker';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { useNavigationAlertUnsavedChangesOnRemove } from 'src/hooks';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

import { ImagePreviewPicker, TextArea } from './components';
import { useHandleSubmitNavigationButton } from './hooks';

const MAX_MEDIA_COUNT = 8;
const MAX_CAPTION_LENGTH = 280;

const galleyPostSchema = yup.object({
  media: yup
    .array()
    .required()
    .min(1, 'Please upload at least one photo')
    .max(
      MAX_MEDIA_COUNT,
      `You can only upload up to ${MAX_MEDIA_COUNT} photos at a time`,
    ),
  caption: yup
    .string()
    .trim()
    .required('Please write a caption of at least 3 words')
    .max(
      MAX_CAPTION_LENGTH,
      `Your caption is too long! Please enter at most ${MAX_CAPTION_LENGTH} characters`,
    )
    .test('has at least 3 words', 'Please enter at least 3 words', input => {
      if (!input) return false;
      return utilities.getWordCount(input) >= 3;
    }),
});

type GalleryPostForm = Omit<yup.InferType<typeof galleyPostSchema>, 'media'> & {
  media: Image[];
};

type CreateGalleryPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateGalleryPost'>;

export default function CreateGalleryPostScreen(
  props: CreateGalleryPostScreenProps,
) {
  const handleNavigateToPreview = (values: GalleryPostForm) => {
    const sources = values.media.map(utilities.mapImageToMediaSource);
    props.navigation
      .getParent<CreateItemStackNavigationProp>()
      .navigate('CreateItemPreview', {
        type: 'post',
        contents: {
          type: 'gallery',
          caption: values.caption.trim(),
          sources: sources,
        },
      });
  };

  return (
    <Formik<GalleryPostForm>
      initialValues={{ media: [], caption: '' }}
      validationSchema={galleyPostSchema}
      onSubmit={(values, helpers) => {
        handleNavigateToPreview(values);
        helpers.resetForm({ values });
      }}>
      <GalleryPostFormikForm />
    </Formik>
  );
}

function GalleryPostFormikForm() {
  const { dirty } = useFormikContext<GalleryPostForm>();

  // FIXME: This will still show an alert in the following situations:
  //   - The user has switched to another tab when the form is dirty
  // FIXME: This will NOT show an alert in the following situations:
  //   - The user has pressed "Post", navigated back and pressed the close
  //     button even if the form is still dirty
  useNavigationAlertUnsavedChangesOnRemove(dirty);
  useHandleSubmitNavigationButton<GalleryPostForm>();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={galleryPostFormikFormStyles.scrollView}>
      <KeyboardAvoidingView
        behavior="position"
        keyboardVerticalOffset={Platform.select({ ios: -100 })}
        style={{ flexGrow: 1 }}>
        <ImagePreviewPicker
          fieldName="media"
          maxCount={MAX_MEDIA_COUNT}
          caption={`Upload up to ${MAX_MEDIA_COUNT} photos below`}
        />
        <TextArea
          fieldName="caption"
          placeholder="Write a caption…"
          containerStyle={[
            galleryPostFormikFormStyles.container,
            { flexGrow: 1 },
          ]}
        />
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const galleryPostFormikFormStyles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    paddingVertical: constants.layout.spacing.lg,
  },
  container: {
    paddingHorizontal: constants.layout.spacing.lg,
  },
});
