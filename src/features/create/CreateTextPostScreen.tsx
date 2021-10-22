import React, { useCallback } from 'react';
import {
  Keyboard,
  Text,
  TextInput as RNTextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';
import { useFocusEffect } from '@react-navigation/native';

import { Button } from 'src/components';
import { color, font, layout } from 'src/constants';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

type TextPostForm = {
  text: string;
};

const textPostSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required('Please enter at least 3 words')
    .max(280, 'Your post is too long! Please enter at most 280 characters.')
    .test('has at least 3 words', 'Please enter at least 3 words', value => {
      if (!value) return false;
      return value.trim().split(/\s/).length >= 3;
    }),
});

type CreateTextPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateTextPost'>;

export default function CreateTextPostScreen(props: CreateTextPostScreenProps) {
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
  const navigation = useNavigation<CreateTextPostScreenProps['navigation']>();
  const { handleSubmit } = useFormikContext<TextPostForm>();

  useFocusEffect(
    useCallback(() => {
      navigation.getParent<CreateItemStackNavigationProp>().setOptions({
        headerRight: () => (
          <Button
            title="Next"
            type="primary"
            size="medium"
            onPress={handleSubmit}
          />
        ),
      });
    }, [navigation, handleSubmit]),
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[layout.defaultScreenStyle, { flex: 1 }]}>
        <TextArea fieldName="text" placeholder="What's on your mind?" />
      </View>
    </TouchableWithoutFeedback>
  );
}

type TextAreaProps = {
  fieldName: string;
  placeholder?: string;
};

function TextArea(props: TextAreaProps) {
  const [field, meta, _helpers] = useField(props.fieldName);
  return (
    <>
      <RNTextInput
        multiline
        placeholder={props.placeholder}
        placeholderTextColor={color.gray500}
        value={field.value}
        onChangeText={field.onChange('text')}
        onBlur={field.onBlur('text')}
        style={[font.h3, { textAlignVertical: 'top', minHeight: '25%' }]}
      />
      {meta.touched && meta.error && (
        <Text style={[font.smallBold, { color: color.danger }]}>
          {meta.error}
        </Text>
      )}
    </>
  );
}
