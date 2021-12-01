import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';

import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import * as utilities from 'src/utilities';
import { color, font, layout } from 'src/constants';

import {
  useExtendedTheme,
  useNavigationAlertUnsavedChangesOnRemove,
} from 'src/hooks';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

import { useHandleSubmitNavigationButton } from './hooks';

const MAX_TEXT_POST_LENGTH = 280;

const textPostSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required('Please fill in this field')
    .max(
      MAX_TEXT_POST_LENGTH,
      `Your post is too long! Please enter at most ${MAX_TEXT_POST_LENGTH} characters`,
    )
    .test('has at least 3 words', 'Please enter at least 3 words', input => {
      if (!input) return false;
      return utilities.getWordCount(input) >= 3;
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
        contents: { type: 'text', text: values.text.trim() },
      });
  };

  return (
    <Formik<TextPostForm>
      initialValues={{ text: '' }}
      validationSchema={textPostSchema}
      onSubmit={(values, helpers) => {
        handleNavigateToPreview(values);
        helpers.resetForm({ values });
      }}>
      <TextPostFormikForm />
    </Formik>
  );
}

function TextPostFormikForm() {
  const { dirty } = useFormikContext<TextPostForm>();

  // FIXME: This will still show an alert in the following situations:
  //   - The user has switched to another tab when the form is dirty
  // FIXME: This will NOT show an alert in the following situations:
  //   - The user has pressed "Post", navigated back and pressed the close
  //     button even if the form is still dirty
  useNavigationAlertUnsavedChangesOnRemove(dirty);
  useHandleSubmitNavigationButton<TextPostForm>();

  return (
    <View style={[layout.defaultScreenStyle, { flex: 1 }]}>
      <TextArea placeholder="What's on your mind?" />
    </View>
  );
}

type TextAreaProps = {
  placeholder?: string;
};

function TextArea(props: TextAreaProps) {
  const [field, meta, _helpers] = useField<TextPostForm['text']>('text');
  const { colors } = useExtendedTheme();

  const characterCount = React.useMemo(() => {
    return field.value.length;
  }, [field.value]);

  const characterCountColor = useDerivedValue(() => {
    if (characterCount < MAX_TEXT_POST_LENGTH - 50) {
      return withTiming(0.0);
    } else if (characterCount < MAX_TEXT_POST_LENGTH - 10) {
      return withTiming(0.5);
    } else {
      return withTiming(1.0);
    }
  }, [characterCount]);

  const characterCountStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        characterCountColor.value,
        [0, 0.5, 1],
        [color.gray500, color.yellow500, color.red500],
      ),
    }),
    [],
  );

  return (
    // TODO: Fix resizing text input when keyboard is active
    // TODO: Consider using `TextArea` from './components'
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior="height"
        // keyboardVerticalOffset={90}
        style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: layout.spacing.md,
          }}>
          <Animated.Text
            style={[
              font.smallBold,
              characterCountStyle,
              { textAlign: 'right' },
            ]}>
            {characterCount}/280
          </Animated.Text>
          {meta.touched && meta.error && (
            <Text
              numberOfLines={2}
              style={[
                font.smallBold,
                { flexGrow: 1, flexShrink: 1, color: color.danger },
              ]}>
              {meta.error}
            </Text>
          )}
        </View>
        <TextInput
          multiline
          maxFontSizeMultiplier={1.25}
          maxLength={MAX_TEXT_POST_LENGTH}
          placeholder={props.placeholder}
          placeholderTextColor={color.gray500}
          selectionColor={Platform.select({ ios: color.accent })}
          value={field.value}
          onChangeText={field.onChange('text')}
          onBlur={field.onBlur('text')}
          style={[
            font.h3,
            { color: colors.text },
            { textAlignVertical: 'top', minHeight: '20%' },
          ]}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
