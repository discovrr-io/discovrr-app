import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';

import * as yup from 'yup';
import { Formik, FormikProps } from 'formik';

import { selectCurrentUserProfileId } from '../authentication/authSlice';
import TextInput, { TextInputProps } from '../../components/TextInput';
import { RouteError } from '../../components';
import { colors, typography, values } from '../../constants';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';
import { useAppDispatch, useAppSelector } from '../../hooks';

import { editProfile, selectProfileById } from './profilesSlice';

const HEADER_HEIGHT = 250;
const AVATAR_RADIUS = 125;

const MAX_INPUT_LENGTH = 30;
const MAX_BIO_LENGTH = 140;

type ProfileChanges = {
  fullName?: string;
  username?: string;
  // email?: string;
  biography?: string;
};

const profileChangesSchema = yup.object({
  name: yup.string().trim().max(MAX_INPUT_LENGTH),
  username: yup
    .string()
    .min(3, 'Your username should have at least 3 characters')
    .max(15, 'Your username should not be more than 15 characters')
    .matches(/^[A-Za-z_][A-Za-z0-9_]*$/, {
      message:
        'Your username should only contain letters, numbers, and underscores with no spaces',
    }),
  // email: yup.string().trim().email('Please enter a valid email address'),
  biography: yup.string().trim().max(MAX_BIO_LENGTH),
});

export default function ProfileEditScreen() {
  const $FUNC = '[ProfileEditScreen]';

  const profileId = useAppSelector(selectCurrentUserProfileId);
  if (!profileId) return <RouteError />;

  const profile = useAppSelector((st) => selectProfileById(st, profileId));
  if (!profile) return <RouteError />;

  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const formRef = useRef<FormikProps<ProfileChanges> | undefined>();

  const [isSavingChanges, setIsSavingChanges] = useState(false);

  const handleSaveChanges = async (changes: ProfileChanges) => {
    try {
      setIsSavingChanges(true);
      console.log($FUNC, 'Saving profile changes...');

      await dispatch(
        editProfile({
          profileId,
          changes: {
            fullName: changes.fullName?.trim(),
            username: changes.username?.trim(),
            // email: changes.email?.trim(),
            description: changes.biography?.trim(),
          },
        }),
      ).unwrap();

      console.log($FUNC, 'Successfully saved changes');
      Alert.alert(
        'Profile Updated',
        'Your profile details has been successfully updated',
      );
    } catch (error) {
      console.error($FUNC, 'Failed to save profile changes:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "We couldn't save your changes right now. Please try again later.",
      );
    } finally {
      setIsSavingChanges(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const disabled = formRef.current.isValid && isSavingChanges;
        return (
          <TouchableOpacity
            disabled={disabled}
            style={{ marginRight: values.spacing.lg }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={() => formRef.current.handleSubmit()}>
            {isSavingChanges ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text
                style={{
                  fontSize: typography.size.md,
                  fontWeight: '500',
                  color: disabled ? colors.gray500 : colors.accent,
                }}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        );
      },
    });
  }, [navigation, isSavingChanges, formRef.current]);

  // const renderCoverPhotoPicker = () => (
  //   <View style={{ marginVertical: values.spacing.md }}>
  //     <FastImage
  //       source={profile.coverPhoto ?? {}}
  //       style={{ height: HEADER_HEIGHT, backgroundColor: colors.gray200 }}
  //     />
  //     <View style={{ paddingHorizontal: values.spacing.md }}>
  //       {/* <Text>
  //         Your cover photo will be visible to anyone who can visits your profile
  //         page.
  //       </Text> */}
  //       {/* <Button primary size="small" title="Pick Cover Photo" /> */}
  //     </View>
  //   </View>
  // );

  // const renderAvatarPicker = () => (
  //   <View style={{ marginVertical: values.spacing.md }}>
  //     <FastImage
  //       source={profile.avatar ?? {}}
  //       style={{
  //         aspectRatio: 1,
  //         width: AVATAR_RADIUS,
  //         borderRadius: AVATAR_RADIUS / 2,
  //         marginLeft: values.spacing.md,
  //         backgroundColor: colors.gray200,
  //       }}
  //     />
  //   </View>
  // );

  const renderProfileDetailsForm = () => (
    <Formik
      innerRef={formRef}
      validationSchema={profileChangesSchema}
      initialValues={{
        fullName: profile.fullName,
        username: profile.username,
        // email: profile.email,
        biography: profile.description,
      }}
      onSubmit={(values) => handleSaveChanges(values)}>
      {(formikProps) => (
        <InputTable>
          {(props) => (
            <>
              <InputRow
                label="Name"
                placeholder="Enter your full name"
                defaultValue={formikProps.initialValues.fullName}
                maxLength={MAX_INPUT_LENGTH}
                formikField="fullName"
                formikProps={formikProps}
                {...props}
              />
              <InputRow
                label="Username"
                placeholder="Enter a unique username"
                defaultValue={formikProps.initialValues.username}
                maxLength={MAX_INPUT_LENGTH}
                formikField="username"
                formikProps={formikProps}
                {...props}
              />
              {/* TODO: How do we handle the case where a user uses their email for authentication? */}
              {/* <InputRow
                label="Email"
                placeholder="Enter your email"
                defaultValue={formikProps.initialValues.email}
                // maxLength={MAX_INPUT_LENGTH}
                formikField="email"
                formikProps={formikProps}
                {...props}
              /> */}
              <InputRow
                label="Biography"
                multiline
                maxLength={MAX_BIO_LENGTH}
                placeholder="Write a short description about yourself (max 140 characters)"
                defaultValue={formikProps.initialValues.biography}
                formikField="biography"
                formikProps={formikProps}
                style={{ minHeight: 90 }}
                {...props}
              />
            </>
          )}
        </InputTable>
      )}
    </Formik>
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        stickyHeaderIndices={[0, 2, 4]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: values.spacing.huge * 3,
        }}>
        {/* <SectionHeader label="cover photo" iconName="photo" />
        {renderCoverPhotoPicker()}
        <SectionHeader label="profile avatar" iconName="person" />
        {renderAvatarPicker()} */}
        <SectionHeader label="profile details" iconName="assignment" />
        {renderProfileDetailsForm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type SectionHeaderProps = {
  label: string;
  iconName: string;
};

function SectionHeader({ label, iconName }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: values.spacing.md,
      }}>
      <Icon
        name={iconName}
        size={20}
        color={colors.black}
        style={{ marginRight: values.spacing.sm * 1.5 }}
      />
      <Text
        style={{
          fontVariant: ['small-caps'],
          fontWeight: '500',
          fontSize: typography.size.sm,
        }}>
        {label}
      </Text>
    </View>
  );
}

type CommonInputRowProps = {
  labelWidth?: number;
};

type InputTableProps = {
  children: (props: CommonInputRowProps) => React.ReactNode;
};

function InputTable(props: InputTableProps) {
  const { children } = props;
  return <View>{children({ labelWidth: 90 })}</View>;
}

type InputRowProps<FormValues> = CommonInputRowProps &
  Omit<TextInputProps, 'onChangeText'> & {
    label: string;
    formikProps: FormikProps<FormValues>;
    formikField: keyof FormValues;
  };

function InputRow<FormValues>(props: InputRowProps<FormValues>) {
  const { label, labelWidth, formikProps, formikField, ...textInputProps } =
    props;

  const fieldValue = String(formikProps.values[formikField]);
  const didTouchField = formikProps.touched[formikField];
  const errorValue = formikProps.errors[formikField];

  const hasError = didTouchField && Boolean(errorValue);

  return (
    <View
      style={{
        flexDirection: 'row',
        // alignItems: 'center',
        marginHorizontal: values.spacing.lg,
      }}>
      <Text
        numberOfLines={1}
        style={{
          width: labelWidth,
          fontSize: typography.size.md,
          alignSelf: 'center',
        }}>
        {label}
      </Text>
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <TextInput
          {...textInputProps}
          value={fieldValue}
          onChangeText={formikProps.handleChange(formikField)}
          onBlur={formikProps.handleBlur(String(formikField))}
          style={[
            {
              flexGrow: 1,
              flexShrink: 1,
              borderRadius: 0,
              borderWidth: 0,
              borderBottomWidth: values.border.thin,
              borderColor: hasError ? colors.red500 : colors.gray200,
            },
            textInputProps.style,
          ]}
        />
        {hasError && (
          <Text
            style={{
              fontSize: typography.size.sm,
              marginVertical: values.spacing.sm,
              color: colors.red500,
            }}>
            {errorValue}
          </Text>
        )}
      </View>
    </View>
  );
}
