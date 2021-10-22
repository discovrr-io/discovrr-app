import React, { useLayoutEffect } from 'react';
import {
  Keyboard,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';

import { Button } from 'src/components';
import { color, font, layout } from 'src/constants';
import { PostLocation } from 'src/models/post';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

type TextPostForm = {
  text: string;
  location?: PostLocation;
};

const textPostSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required('Please enter at least 3 words')
    .max(280, 'Your post is too long! Please enter at most 280 characters.')
    .test('has at least 3 words', 'Please enter at least 3 words', value => {
      if (!value) return false;
      return value.trim().split(' ').length >= 3;
    }),
});

type CreateTextScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateTextPost'>;

export default function CreateTextScreen(props: CreateTextScreenProps) {
  // const $FUNC = '[CreateTextScreen]';
  // const dispatch = useAppDispatch();
  const navigation = props.navigation;

  // const handleCreatePost = async (values: TextPostForm) => {
  //   try {
  //     console.log($FUNC, 'Publishing text post...');
  //
  //     const createPostAction = createPost({
  //       type: 'text',
  //       text: values.text.trim(),
  //       location: values.location,
  //     });
  //
  //     const newPost = await dispatch(createPostAction).unwrap();
  //     console.log($FUNC, 'Successfully published text post', newPost.id);
  //
  //     navigation.goBack(); // Remove the Create Post pop-up
  //     navigation
  //       .getParent<CreateItemStackNavigationProp>()
  //       .getParent<RootStackNavigationProp>()
  //       .navigate('PostDetails', { postId: newPost.id });
  //   } catch (error) {
  //     console.error($FUNC, 'Failed to create text post:', error);
  //     alertSomethingWentWrong(
  //       "We weren't able to publish your post at the moment. Please try again later.",
  //     );
  //   }
  // };

  const handleNavigateToPreview = (values: TextPostForm) => {
    navigation
      .getParent<CreateItemStackNavigationProp>()
      .navigate('CreateItemPreview', { type: 'text', ...values });
  };

  return (
    <Formik
      initialValues={{ text: '' } as TextPostForm}
      validationSchema={textPostSchema}
      onSubmit={handleNavigateToPreview}>
      <NewTextPostFormikForm />
    </Formik>
  );
}

function NewTextPostFormikForm() {
  const navigation = useNavigation<CreateTextScreenProps['navigation']>();
  const {
    dirty,
    isSubmitting,
    isValid,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useFormikContext<TextPostForm>();

  useLayoutEffect(() => {
    navigation.getParent<CreateItemStackNavigationProp>().setOptions({
      headerRight: () => {
        const canSubmit = dirty && isValid && !isSubmitting;
        return (
          <Button
            title="Next"
            type="primary"
            size="medium"
            disabled={!canSubmit}
            // loading={isSubmitting}
            onPress={handleSubmit}
          />
        );
      },
    });
  }, [navigation, dirty, isSubmitting, isValid, handleSubmit]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={100}
        style={[layout.defaultScreenStyle,{ flex: 1 }]}>
        <View
          style={[
            layout.defaultScreenStyle,
            { flexGrow: 1, justifyContent: 'space-between' },
          ]}>
        </View>
      </KeyboardAvoidingView> */}
      <View style={[layout.defaultScreenStyle, { flex: 1 }]}>
        <TextArea
          autoFocus
          placeholder="What's on your mind?"
          onBlur={handleBlur('text')}
          onChangeText={handleChange('text')}
          style={{ minHeight: '25%', backgroundColor: 'pink' }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

type TextAreaProps = RNTextInputProps;

function TextArea(props: TextAreaProps) {
  const [_field, _meta, _helpers] = useField({
    name: 'text-area',
    type: 'text',
  });

  return (
    <RNTextInput
      {...props}
      multiline
      placeholderTextColor={color.gray500}
      style={[font.extraLarge, { textAlignVertical: 'top' }, props.style]}
    />
  );
}
