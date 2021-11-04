import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';
import { Image } from 'react-native-image-crop-picker';

import * as utilities from 'src/utilities';
import { color, font, layout } from 'src/constants';
import { useNavigationAlertUnsavedChangesOnRemove } from 'src/hooks';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

import { ImagePreviewPicker } from './components';
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
  const { dirty, handleSubmit } = useFormikContext<GalleryPostForm>();

  const [field, meta, _] = useField<GalleryPostForm['caption']>('caption');

  // FIXME: This will still show an alert in the following situations:
  //   - The user has switched to another tab when the form is dirty
  // FIXME: This will NOT show an alert in the following situations:
  //   - The user has pressed "Post", navigated back and pressed the close
  //     button even if the form is still dirty
  useNavigationAlertUnsavedChangesOnRemove(dirty);
  useHandleSubmitNavigationButton<GalleryPostForm>(handleSubmit);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={galleryPostFormikFormStyles.scrollView}>
      <KeyboardAvoidingView
        behavior="position"
        keyboardVerticalOffset={Platform.select({ ios: -80 })}
        style={{ flexGrow: 1 }}>
        <ImagePreviewPicker
          fieldName="media"
          maxCount={MAX_MEDIA_COUNT}
          caption={`Upload up to ${MAX_MEDIA_COUNT} photos below`}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={[galleryPostFormikFormStyles.container, { flexGrow: 1 }]}>
            <TextInput
              multiline
              maxLength={MAX_CAPTION_LENGTH}
              placeholder="Write a caption…"
              placeholderTextColor={color.gray500}
              selectionColor={Platform.select({ ios: color.accent })}
              value={field.value}
              onChangeText={field.onChange('caption')}
              onBlur={field.onBlur('caption')}
              style={[
                font.extraLarge,
                {
                  textAlignVertical: 'top',
                  minHeight: !meta.error ? '20%' : undefined,
                },
              ]}
            />
            {meta.error && meta.touched && (
              <Text
                style={[
                  font.smallBold,
                  { color: color.danger, paddingTop: layout.spacing.sm },
                ]}>
                {meta.error}
              </Text>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const galleryPostFormikFormStyles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    paddingVertical: layout.spacing.lg,
  },
  container: {
    paddingHorizontal: layout.spacing.lg,
  },
});
