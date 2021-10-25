import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
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

const MAX_TEXT_POST_LENGTH = 280;

type TextPostForm = {
  text: string;
};

const textPostSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required('Please enter at least 3 words')
    .max(
      MAX_TEXT_POST_LENGTH,
      'Your post is too long! Please enter at most 280 characters.',
    )
    .test('has at least 3 words', 'Please enter at least 3 words', value => {
      if (!value) return false;
      return value.trim().split(/\s/).filter(Boolean).length >= 3;
    }),
});

type CreateTextPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateTextPost'>;

export default function CreateTextPostScreen(props: CreateTextPostScreenProps) {
  const navigation = props.navigation;

  const handleNavigateToPreview = (values: TextPostForm) => {
    navigation
      .getParent<CreateItemStackNavigationProp>()
      .navigate('CreateItemPreview', {
        type: 'post',
        contents: { type: 'text', ...values },
      });
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
    <View style={[layout.defaultScreenStyle, { flex: 1 }]}>
      <TextArea fieldName="text" placeholder="What's on your mind?" />
    </View>
  );
}

type TextAreaProps = {
  fieldName: string;
  placeholder?: string;
};

function TextArea(props: TextAreaProps) {
  const [field, meta, _helpers] = useField(props.fieldName);
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior="height"
        keyboardVerticalOffset={90}
        style={{ flex: 1 }}>
        {meta.touched && meta.error && (
          <Text style={[font.smallBold, { color: color.danger }]}>
            {meta.error}
          </Text>
        )}
        <RNTextInput
          multiline
          numberOfLines={8}
          placeholder={props.placeholder}
          placeholderTextColor={color.gray500}
          maxLength={MAX_TEXT_POST_LENGTH}
          value={field.value}
          onChangeText={field.onChange('text')}
          onBlur={field.onBlur('text')}
          style={[
            font.h3,
            {
              flexGrow: 1,
              textAlignVertical: 'top',
              minHeight: '30%',
              maxHeight: '75%',
            },
          ]}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
