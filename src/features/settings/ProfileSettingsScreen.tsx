import React, { useLayoutEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView } from 'react-native';

import * as yup from 'yup';
import { Formik, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';

import { ProfileApi } from 'src/api';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { color, layout } from 'src/constants';
import { updateProfile } from 'src/features/profiles/profilesSlice';
import { useMyProfileId, useProfile } from 'src/features/profiles/hooks';
import { useAppDispatch } from 'src/hooks';
import { Profile, ProfileId } from 'src/models';
import { SettingsStackScreenProps } from 'src/navigation';

import {
  AsyncGate,
  Button,
  LoadingContainer,
  RouteError,
  Spacer,
} from 'src/components';

import Cell from './components';
import { CELL_GROUP_VERTICAL_SPACING } from './components/CellGroup';
import { CELL_ICON_SIZE } from './components/common';

const MAX_INPUT_LENGTH = 30;
const MAX_BIO_LENGTH = 140;

const profileChangesSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .required('Please enter your name')
    .min(3, 'Your display name should have at least 3 characters')
    .max(MAX_INPUT_LENGTH),
  username: yup
    .string()
    .trim()
    .required('Please enter a unique username')
    .min(3, 'Your username should have at least 3 characters')
    .max(15, 'Your username should not be more than 15 characters')
    .matches(/^[A-Za-z0-9_][A-Za-z0-9_]*$/, {
      message:
        'Your username should only contain letters, numbers, and underscores with no spaces',
    }),
  // email: yup
  //   .string()
  //   .trim()
  //   .required('Please enter your email address')
  //   .email('Please enter a valid email address'),
  biography: yup.string().trim().max(MAX_BIO_LENGTH),
});

// const ProfileSettingsContext = React.createContext({ hasSyncedChanges: true });

type ProfileSettingsProps = SettingsStackScreenProps<'ProfileSettings'>;

export default function ProfileSettingsScreenWrapper(
  props: ProfileSettingsProps,
) {
  const myProfileId = useMyProfileId();

  if (!myProfileId) {
    return (
      <RouteError message="We weren't able to get your profile details." />
    );
  }

  return <ProfileSettingsScreen myProfileId={myProfileId} {...props} />;
}

function ProfileSettingsScreen(
  props: ProfileSettingsProps & { myProfileId: ProfileId },
) {
  const profileData = useProfile(props.myProfileId);

  const renderRouteError = () => (
    <RouteError message="We weren't able to find your profile." />
  );

  return (
    <AsyncGate
      data={profileData}
      onPending={() => <LoadingContainer />}
      onFulfilled={profile => {
        if (!profile) return renderRouteError();
        return <LoadedProfileSettingsScreen profile={profile} />;
      }}
      onRejected={renderRouteError}
    />
  );
}

type LoadedAccountSettingsScreenProps = {
  profile: Profile;
};

function LoadedProfileSettingsScreen(props: LoadedAccountSettingsScreenProps) {
  const $FUNC = '[LoadedProfileSettingsScreen]';
  const { profile } = props;

  const dispatch = useAppDispatch();

  const handleSaveChanges = async (changes: ProfileApi.ProfileChanges) => {
    try {
      const updateProfileAction = updateProfile({
        profileId: profile.id,
        changes: {
          displayName: changes.displayName?.trim(),
          username: changes.username?.trim(),
          // description: changes.description?.trim(),
          biography: changes.biography?.trim(),
          email: changes.email?.trim(),
        },
      });

      await dispatch(updateProfileAction).unwrap();

      Alert.alert(
        'Profile Updated',
        'Your changes has been successfully saved',
      );
    } catch (error) {
      console.error($FUNC, 'Failed to update profile:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "We weren't able to update your profile at the moment. Please try again later.",
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={layout.defaultScreenStyle}>
        <Formik
          initialValues={{
            displayName: profile.displayName,
            username: profile.username,
            biography: profile.biography,
          }}
          enableReinitialize={true}
          validationSchema={profileChangesSchema}
          onSubmit={handleSaveChanges}>
          <ProfileSettingsForm />
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileSettingsForm() {
  const $FUNC = '[ProfileSettingsForm]';
  // const navigation = useNavigation<SettingsStackNavigationProp>();
  const navigation = useNavigation<ProfileSettingsProps['navigation']>();

  const [selection, setSelection] = useState('user');

  const {
    dirty,
    values,
    errors,
    isSubmitting,
    isValid,
    handleBlur,
    handleChange,
    handleSubmit,
    setFieldValue,
  } = useFormikContext<ProfileApi.ProfileChanges>();

  const handleGenerateRandomUsername = async () => {
    try {
      const username = await ProfileApi.generateRandomUsername();
      setFieldValue('username', username);
    } catch (error) {
      console.error($FUNC, 'Failed to generate random username:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "We weren't able to generate a username for you. Please try again later.",
      );
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/display-name
      headerRight: () => {
        const canSubmit = dirty && isValid && !isSubmitting;
        return (
          <Button
            title="Save"
            type="primary"
            variant="text"
            size="medium"
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={handleSubmit}
            textStyle={{ textAlign: 'right' }}
            containerStyle={{
              alignItems: 'flex-end',
              paddingHorizontal: 0,
              marginRight: layout.defaultScreenMargins.horizontal,
            }}
          />
        );
      },
    });
  }, [navigation, dirty, isSubmitting, isValid, handleSubmit]);

  // FIXME: This doesn't work if we've already saved the form
  // ---
  // useEffect(() => {
  //   navigation.addListener('beforeRemove', e => {
  //     if (!dirty) return;
  //
  //     e.preventDefault();
  //     Alert.alert(
  //       'Discard changes?',
  //       'You have unsaved changes. Are you sure you want to discard them?',
  //       [
  //         { text: "Don't Leave", style: 'cancel' },
  //         {
  //           text: 'Discard Changes',
  //           style: 'destructive',
  //           onPress: () => navigation.dispatch(e.data.action),
  //         },
  //       ],
  //     );
  //   });
  // }, [navigation, dirty]);

  return (
    <>
      <Cell.Group
        label="Profile details"
        elementOptions={{
          // containerSpacingVertical: layout.spacing.md * 1.25,
          containerSpacingHorizontal: layout.spacing.md * 1.25,
        }}>
        <Cell.InputGroup labelFlex={1.1}>
          <Cell.Input
            label="Name"
            autoCapitalize="words"
            placeholder="Enter your full name"
            value={values.displayName}
            onBlur={handleBlur('displayName')}
            onChangeText={handleChange('displayName')}
            error={errors.displayName}
          />
          <Cell.Input
            label="Username"
            autoCapitalize="none"
            placeholder="Enter a unique username"
            value={values.username}
            onBlur={handleBlur('username')}
            onChangeText={handleChange('username')}
            error={errors.username}
            // prefix={<Cell.Input.Affix text="@" />}
            suffix={
              <Cell.Input.Icon
                name="reload-outline"
                color={color.accent}
                onPress={handleGenerateRandomUsername}
              />
            }
          />
          <Cell.Input
            multiline
            label="Biography"
            placeholder="Write a short biography about yourself (max 140 characters)"
            value={values.biography}
            onBlur={handleBlur('biography')}
            onChangeText={handleChange('biography')}
            error={errors.biography}
          />
        </Cell.InputGroup>
      </Cell.Group>
      <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
      <Cell.Group
        label="Account type"
        elementOptions={{ iconSize: CELL_ICON_SIZE * 1.5 }}>
        <Cell.Select
          value={selection}
          onValueChanged={option => setSelection(option)}>
          <Cell.Option
            label="User"
            value="user"
            caption="Post, share and like content created by other users and makers"
          />
          <Cell.Option
            label="Maker"
            value="maker"
            caption="Advertise products and workshops to help your business grow"
          />
        </Cell.Select>
      </Cell.Group>
    </>
  );
}