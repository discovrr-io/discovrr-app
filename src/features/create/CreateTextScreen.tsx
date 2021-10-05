import React, { useLayoutEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';

import { Button, Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';
import { createPost } from 'src/features/posts/postsSlice';
import { useAppDispatch } from 'src/hooks';
import { PostLocation, PostType } from 'src/models/post';
import { alertSomethingWentWrong } from 'src/utilities';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
  RootStackNavigationProp,
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

type CreateTextScreenProps = CreateItemDetailsTopTabScreenProps<'CreateText'>;

export default function CreateTextScreen(props: CreateTextScreenProps) {
  const $FUNC = '[CreateTextScreen]';
  const dispatch = useAppDispatch();
  const { navigation } = props;

  const handleCreatePost = async (values: TextPostForm) => {
    try {
      console.log($FUNC, 'Publishing text post...');

      const createPostAction = createPost({
        type: PostType.TEXT,
        text: values.text.trim(),
        location: values.location,
      });

      const newPost = await dispatch(createPostAction).unwrap();
      console.log($FUNC, 'Successfully published text post', newPost.id);

      navigation.goBack(); // Remove the Create Post pop-up
      navigation
        .getParent<CreateItemStackNavigationProp>()
        .getParent<RootStackNavigationProp>()
        .navigate('PostDetails', { postId: newPost.id });
    } catch (error) {
      console.error($FUNC, 'Failed to create text post:', error);
      alertSomethingWentWrong(
        "We weren't able to publish your post at the moment. Please try again later.",
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        layout.defaultScreenStyle,
        {
          flex: 1,
          // backgroundColor: 'pink'
        },
      ]}>
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        style={[
          {
            // backgroundColor: 'lightgreen'
          },
        ]}>
        <KeyboardAvoidingView style={{ flex: 1 }}>
          <Formik
            initialValues={{ text: '' } as TextPostForm}
            validationSchema={textPostSchema}
            onSubmit={handleCreatePost}>
            <NewTextPostFormikForm />
          </Formik>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
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
      // eslint-disable-next-line react/display-name
      headerRight: () => {
        const canSubmit = dirty && isValid && !isSubmitting;
        return (
          <Button
            title="Post"
            type="primary"
            size="medium"
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={handleSubmit}
          />
        );
      },
    });
  }, [navigation, dirty, isSubmitting, isValid, handleSubmit]);

  return (
    <>
      <TextArea
        placeholder="What's on your mind?"
        onBlur={handleBlur('text')}
        onChangeText={handleChange('text')}
        style={{ flex: 1 }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: layout.spacing.md,
          // backgroundColor: 'lightgreen',
        }}>
        <Icon name="location" size={24} color={color.black} />
        <Spacer.Horizontal value={layout.spacing.sm} />
        <Text style={[font.medium]}>Select your location…</Text>
      </View>
    </>
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
      autoFocus
      multiline
      placeholderTextColor={color.gray500}
      style={[
        font.large,
        {
          textAlignVertical: 'top',
          // backgroundColor: 'lightblue',
        },
        props.style,
      ]}
    />
  );
}
