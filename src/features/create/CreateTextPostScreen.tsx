import * as React from 'react';
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

const textPostSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required('Please enter at least 3 words')
    .max(
      MAX_TEXT_POST_LENGTH,
      `Your post is too long! Please enter at most ${MAX_TEXT_POST_LENGTH} characters`,
    )
    .test('has at least 3 words', 'Please enter at least 3 words', value => {
      if (!value) return false;
      return value.trim().split(/\s/).filter(Boolean).length >= 3;
    }),
});

type TextPostForm = yup.InferType<typeof textPostSchema>;

type CreateTextPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateTextPost'>;

export default function CreateTextPostScreen(props: CreateTextPostScreenProps) {
  const handleNavigateToPreview = (values: TextPostForm) => {
    props.navigation
      .getParent<CreateItemStackNavigationProp>()
      .navigate('CreateItemPreview', {
        type: 'post',
        contents: { type: 'text', ...values },
      });
  };

  return (
    <Formik<TextPostForm>
      initialValues={{ text: '' }}
      validationSchema={textPostSchema}
      onSubmit={handleNavigateToPreview}>
      <TextPostFormikForm />
    </Formik>
  );
}

function TextPostFormikForm() {
  const navigation = useNavigation<CreateTextPostScreenProps['navigation']>();
  const { handleSubmit } = useFormikContext<TextPostForm>();

  useFocusEffect(
    React.useCallback(() => {
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
          maxLength={MAX_TEXT_POST_LENGTH}
          placeholder={props.placeholder}
          placeholderTextColor={color.gray500}
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
