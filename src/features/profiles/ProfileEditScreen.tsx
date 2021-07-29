import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';

import TextInput, { TextInputProps } from '../../components/TextInput';
import { colors, typography, values } from '../../constants';
import { useAppSelector } from '../../hooks';
import { selectCurrentUserProfileId } from '../authentication/authSlice';
import { selectProfileById } from './profilesSlice';

const HEADER_HEIGHT = 250;
const AVATAR_RADIUS = 125;

const MAX_INPUT_LENGTH = 30;
const MAX_BIO_LENGTH = 140;

export default function ProfileEditScreen() {
  // FIXME: This could be undefined
  const profileId = useAppSelector(selectCurrentUserProfileId);
  const profile = useAppSelector((state) =>
    selectProfileById(state, profileId),
  );

  const renderCoverPhotoPicker = () => (
    <View style={{ marginVertical: values.spacing.md }}>
      <FastImage
        source={profile.coverPhoto ?? {}}
        style={{ height: HEADER_HEIGHT, backgroundColor: colors.gray200 }}
      />
      <View style={{ paddingHorizontal: values.spacing.md }}>
        {/* <Text>
          Your cover photo will be visible to anyone who can visits your profile
          page.
        </Text> */}
        {/* <Button primary size="small" title="Pick Cover Photo" /> */}
      </View>
    </View>
  );

  const renderAvatarPicker = () => (
    <View style={{ marginVertical: values.spacing.md }}>
      <FastImage
        source={profile.avatar ?? {}}
        style={{
          aspectRatio: 1,
          width: AVATAR_RADIUS,
          borderRadius: AVATAR_RADIUS / 2,
          marginLeft: values.spacing.md,
          backgroundColor: colors.gray200,
        }}
      />
    </View>
  );

  // TODO: Use formik for validation
  const renderProfileDetailsForm = () => (
    <InputTable>
      {(props) => (
        <>
          <InputRow
            label="Name"
            placeholder="Enter your full name"
            defaultValue={profile.fullName}
            maxLength={MAX_INPUT_LENGTH}
            {...props}
          />
          <InputRow
            label="Username"
            placeholder="Enter a unique username"
            defaultValue={profile.username}
            maxLength={MAX_INPUT_LENGTH}
            {...props}
          />
          <InputRow
            label="Email"
            placeholder="Enter your email"
            defaultValue={profile.email}
            // maxLength={MAX_INPUT_LENGTH}
            {...props}
          />
          <InputRow
            label="Biography"
            multiline
            maxLength={MAX_BIO_LENGTH}
            placeholder="Write a short description about yourself (max 140 characters)"
            // defaultValue={profile.description}
            style={{ height: 90 }}
            {...props}
          />
        </>
      )}
    </InputTable>
  );

  return (
    <ScrollView
      stickyHeaderIndices={[0, 2, 4]}
      style={{ backgroundColor: colors.white }}
      contentContainerStyle={{ paddingBottom: values.spacing.huge * 2 }}>
      <SectionHeader label="cover photo" iconName="photo" />
      {renderCoverPhotoPicker()}
      <SectionHeader label="profile avatar" iconName="person" />
      {renderAvatarPicker()}
      <SectionHeader label="profile details" iconName="assignment" />
      {renderProfileDetailsForm()}
    </ScrollView>
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

type InputRowProps = CommonInputRowProps & {
  label: string;
};

function InputRow(props: InputRowProps & TextInputProps) {
  const { label, labelWidth, ...textInputProps } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: values.spacing.lg,
      }}>
      <Text
        numberOfLines={1}
        style={{
          width: labelWidth,
          fontSize: typography.size.md,
        }}>
        {label}
      </Text>
      <TextInput
        {...textInputProps}
        style={[
          {
            flexGrow: 1,
            flexShrink: 1,
            borderRadius: 0,
            borderWidth: 0,
            borderBottomWidth: values.border.thin,
            borderColor: colors.gray200,
          },
          textInputProps.style,
        ]}
      />
    </View>
  );
}
