import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

import * as yup from 'yup';
import BottomSheet from '@gorhom/bottom-sheet';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import ImageCropPicker, { Image } from 'react-native-image-crop-picker';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';
import { useSharedValue } from 'react-native-reanimated';

import * as utilities from 'src/utilities';
import { AuthApi, MediaSource, ProfileApi } from 'src/api';
import { updateProfile } from 'src/features/profiles/profiles-slice';
import { useMyProfileId, useProfile } from 'src/features/profiles/hooks';
import { Profile, ProfileId } from 'src/models';
import { RootStackScreenProps } from 'src/navigation';

import { color, font, layout, media } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import { selectCurrentUserProfileKind } from 'src/global-selectors';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  Button,
  Cell,
  LoadingContainer,
  LoadingOverlay,
  RouteError,
  Spacer,
} from 'src/components';

import {
  useAppDispatch,
  useAppSelector,
  useIsMounted,
  useNavigationAlertUnsavedChangesOnRemove,
} from 'src/hooks';

const MAX_INPUT_LENGTH = 30;
const MAX_BIO_LENGTH = 140;
const AVATAR_DIAMETER = 140;

const IMAGE_COMPRESSION_QUALITY = 0.7;
const IMAGE_COMPRESSION_MAX_WIDTH = media.DEFAULT_AVATAR_DIMENSIONS.width;
const IMAGE_COMPRESSION_MAX_HEIGHT = media.DEFAULT_AVATAR_DIMENSIONS.height;

const profileChangesSchema = yup.object({
  avatar: yup.object().nullable().notRequired(),
  displayName: yup
    .string()
    .trim()
    .required('Please enter your name')
    .min(3, 'Your display name should have at least 3 characters')
    .max(
      MAX_INPUT_LENGTH,
      `Your display name should be no longer than ${MAX_INPUT_LENGTH} characters`,
    ),
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
  biography: yup
    .string()
    .trim()
    .max(
      MAX_BIO_LENGTH,
      `Your biography should be no longer than ${MAX_BIO_LENGTH} characters`,
    ),
});

type ProfileChangesForm = Omit<
  yup.InferType<typeof profileChangesSchema>,
  'avatar'
> & {
  /**
   * If set to `undefined`, the user has NOT changed their current avatar (and
   * so it doesn't need to be uploaded). Otherwise, explicitly set it to `null`
   * to remove the current avatar.
   */
  avatar?: Image | null;
};

function ProfileNotFoundRouteError() {
  return <RouteError message="We weren't able to find your profile." />;
}

type ProfileSettingsScreenProps = RootStackScreenProps<'ProfileSettings'>;

export default function ProfileSettingsScreen(
  props: ProfileSettingsScreenProps,
) {
  const myProfileId = useMyProfileId();
  if (!myProfileId) return <ProfileNotFoundRouteError />;

  return <ProfileSettingsScreenInner myProfileId={myProfileId} {...props} />;
}

function ProfileSettingsScreenInner(
  props: ProfileSettingsScreenProps & { myProfileId: ProfileId },
) {
  const profileData = useProfile(props.myProfileId);

  return (
    <AsyncGate
      data={profileData}
      onPending={() => <LoadingContainer />}
      onFulfilled={profile => {
        if (!profile) return <ProfileNotFoundRouteError />;
        return <LoadedProfileSettingsScreen profile={profile} />;
      }}
      onRejected={ProfileNotFoundRouteError}
    />
  );
}

type LoadedProfileSettingsScreenProps = {
  profile: Profile;
};

function LoadedProfileSettingsScreen(props: LoadedProfileSettingsScreenProps) {
  const $FUNC = '[LoadedProfileSettingsScreen]';
  const dispatch = useAppDispatch();
  const profile = props.profile;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [overlayContent, setOverlayContent] = React.useState<{
    message?: string;
    caption?: string;
    isUploading?: boolean;
  }>({
    message: 'Getting ready…',
    caption: "This won't take long",
    isUploading: false,
  });

  const currentUploadProgress = useSharedValue(0);

  const handleSaveChanges = async (changes: ProfileChangesForm) => {
    try {
      Keyboard.dismiss();
      setIsSubmitting(true);

      // First check if the username is available (if it has been changed)
      if (profile.username !== changes.username) {
        if (!(await AuthApi.checkIfUsernameAvailable(changes.username))) {
          throw new Error(
            'This username is already taken. Please choose another one',
          );
        }
      }

      // Then upload the new profile avatar (if it has been changed)
      let processedAvatar: MediaSource | null | undefined = undefined;

      console.log('CHANGES AVATAR', changes.avatar);

      // We'll remove the current avatar even if we're uploading a new one
      if (changes.avatar !== undefined) {
        console.log($FUNC, 'Removing current avatar...');
        processedAvatar = null;

        // First, remove it from the Firebase profile
        await auth().currentUser?.updateProfile({ photoURL: null });

        // Then delete it from Firebase Cloud Storage
        const oldProfileAvatarFilename = profile.avatar?.filename;
        if (oldProfileAvatarFilename) {
          console.log(
            $FUNC,
            'Deleting old profile avatar from Cloud Storage:',
            oldProfileAvatarFilename,
          );

          try {
            const reference = storage().ref(
              `/avatars/${oldProfileAvatarFilename}`,
            );
            await reference.delete();
          } catch (error) {
            // We'll just continue on if this fails
            console.error(
              'Failed to delete old profile image from Firebase:',
              error,
            );
          }
        }
      }

      // We'll upload the new avatar if it's set to a defined value
      if (changes.avatar) {
        console.log($FUNC, 'Uploading avatar...');
        setOverlayContent({
          message: 'Uploading avatar…',
          caption: 'This may take a while',
          isUploading: true,
        });

        // Only select these fields - the others are not important
        const source: MediaSource = {
          mime: changes.avatar.mime,
          url: changes.avatar.path,
          size: changes.avatar.size,
          width: changes.avatar.width,
          height: changes.avatar.height,
        };

        const [filename, task, reference] =
          utilities.createUploadFileToFirebaseTask(
            source,
            ({ filename }) => `/avatars/${filename}`,
          );

        task.on('state_changed', snapshot => {
          currentUploadProgress.value =
            snapshot.bytesTransferred / snapshot.totalBytes;
        });

        await task.then(() => {
          console.log($FUNC, 'Successfully uploaded avatar');
        });

        const avatarDownloadURL = await reference.getDownloadURL();
        const firebaseCurrentUser = auth().currentUser;

        // We'll apply the avatar to the Firebase profile
        if (firebaseCurrentUser) {
          setOverlayContent(prev => ({
            ...prev,
            message: 'Applying avatar…',
          }));

          await firebaseCurrentUser.updateProfile({
            photoURL: avatarDownloadURL,
          });
        } else {
          console.warn(
            $FUNC,
            'Firebase user is null, which is unexpected.',
            'Skipping profile photo URL update...',
          );
        }

        // We'll set the download URL to the `url` property and replace
        // `filename` with its filename in Cloud Storage (so we can easily
        // reference to it later on if we need to).
        processedAvatar = {
          ...source,
          filename,
          url: avatarDownloadURL,
          path: undefined,
        };
      }

      setOverlayContent({ message: 'Saving your changes…' });

      const changedDisplayName = changes.displayName.trim();
      const processedDisplayName =
        profile.displayName !== changedDisplayName
          ? changedDisplayName
          : undefined;

      const changedUsername = changes.username.trim();
      const processedUsername =
        profile.username !== changedUsername ? changedUsername : undefined;

      const changedBiography = changes.biography?.trim();
      const processedBiography =
        profile.biography !== changedBiography ? changedBiography : undefined;

      // Finally, we update the profile (with the new avatar if changed).
      const updateProfileAction = updateProfile({
        profileId: profile.profileId,
        // If any of these fields are `undefined`, it will be ignored by Redux
        // and the server.
        changes: {
          avatar: processedAvatar,
          displayName: processedDisplayName,
          username: processedUsername,
          biography: processedBiography,
        },
      });

      await dispatch(updateProfileAction).unwrap();

      Alert.alert(
        'Profile Updated',
        'Your changes has been successfully saved.',
      );
    } catch (error: any) {
      console.error($FUNC, 'Failed to update profile:', error);
      utilities.alertSomethingWentWrong(
        error.message ??
          "We weren't able to update your profile at the moment. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
      currentUploadProgress.value = 0;
    }
  };

  return (
    <ProfileSettingsFormContext.Provider value={{ currentProfile: profile }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[layout.defaultScreenStyle, { flexGrow: 1 }]}>
          <Formik<ProfileChangesForm>
            initialValues={{
              avatar: undefined,
              displayName: profile.displayName,
              username: profile.username,
              biography: profile.biography,
            }}
            enableReinitialize={true}
            validationSchema={profileChangesSchema}
            onSubmit={async (values, helpers) => {
              await handleSaveChanges(values);
              helpers.resetForm({ values });
            }}>
            <ProfileSettingsFormikForm />
          </Formik>
        </ScrollView>
      </SafeAreaView>
      {isSubmitting && (
        <LoadingOverlay
          message={overlayContent.message}
          caption={overlayContent.caption}
          progress={
            overlayContent.isUploading ? currentUploadProgress : undefined
          }
        />
      )}
    </ProfileSettingsFormContext.Provider>
  );
}

type ProfileSettingsFormContextProps = {
  currentProfile: Profile;
};

const ProfileSettingsFormContext =
  React.createContext<ProfileSettingsFormContextProps>(null as any);

function ProfileSettingsFormikForm() {
  const $FUNC = '[ProfileSettingsForm]';
  const navigation = useNavigation<ProfileSettingsScreenProps['navigation']>();
  const isMounted = useIsMounted();

  const currentProfileKind = useAppSelector(selectCurrentUserProfileKind);
  const [isGeneratingUsername, setIsGeneratingUsername] = React.useState(false);

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
  } = useFormikContext<ProfileChangesForm>();

  const handleGenerateRandomUsername = async () => {
    try {
      setIsGeneratingUsername(true);
      const username = await ProfileApi.generateRandomUsername();
      if (isMounted.current) setFieldValue('username', username);
    } catch (error) {
      console.error($FUNC, 'Failed to generate random username:', error);
      utilities.alertSomethingWentWrong(
        "We weren't able to generate a username for you. Please try again later.",
      );
    } finally {
      if (isMounted.current) setIsGeneratingUsername(false);
    }
  };

  useNavigationAlertUnsavedChangesOnRemove(dirty);

  React.useLayoutEffect(() => {
    navigation.setOptions({
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

  // FIXME: Get this to work properly with KeyboardAvoidingView
  return (
    <>
      <View style={{ alignItems: 'center' }}>
        <ProfileAvatarPicker />
      </View>
      <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING * 2} />
      <Cell.Group
        label="My Details"
        elementOptions={{
          containerSpacingHorizontal: layout.spacing.md * 1.25,
        }}>
        <Cell.InputGroup labelFlex={1.1}>
          <Cell.Input
            label="Name"
            autoCapitalize="words"
            placeholder="Enter your full name"
            value={values.displayName}
            onChangeText={handleChange('displayName')}
            onBlur={handleBlur('displayName')}
            error={errors.displayName}
          />
          <Cell.Input
            label="Username"
            autoCapitalize="none"
            placeholder="Enter a unique username"
            value={values.username}
            onChangeText={handleChange('username')}
            onBlur={handleBlur('username')}
            error={errors.username}
            prefix={
              values.username?.length && values.username.length > 0 ? (
                <Cell.Input.Affix text="@" />
              ) : null
            }
            suffix={
              isGeneratingUsername ? (
                <ActivityIndicator
                  size="small"
                  color={color.accent}
                  style={{ width: 24 }}
                />
              ) : (
                <Cell.Input.Icon
                  name="reload-outline"
                  color={color.accent}
                  onPress={handleGenerateRandomUsername}
                />
              )
            }
          />
          <Cell.Input
            multiline
            label="Biography"
            placeholder="Write a short biography about yourself (max 140 characters)"
            value={values.biography}
            onChangeText={handleChange('biography')}
            onBlur={handleBlur('biography')}
            error={errors.biography}
          />
        </Cell.InputGroup>
      </Cell.Group>
      <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
      <Cell.Group label="Account Type">
        <Cell.Navigator
          label="Change account type"
          iconName="person-outline"
          previewValue={currentProfileKind === 'vendor' ? 'Maker' : 'User'}
          onPress={navigation => navigation.navigate('AccountTypeSettings')}
        />
      </Cell.Group>
      <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
      <Cell.Group label="Account Settings" elementOptions={{ disabled: true }}>
        <Cell.Navigator label="Add public email" iconName="mail-outline" />
        <Cell.Navigator label="Add my hometown" iconName="location-outline" />
        <Cell.Navigator label="Change password" iconName="key-outline" />
      </Cell.Group>
      <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
      <Cell.Group label="Danger Zone" elementOptions={{ disabled: true }}>
        <Cell.Navigator
          label="Deactivate my account"
          iconName="person-remove-outline"
        />
      </Cell.Group>
    </>
  );
}

function ProfileAvatarPicker() {
  const { currentProfile } = React.useContext(ProfileSettingsFormContext);
  const [_, meta, helpers] = useField<ProfileChangesForm['avatar']>('avatar');

  const avatarSource: FastImageProps['source'] = React.useMemo(() => {
    if (meta.value === undefined) {
      return currentProfile.avatar?.url
        ? { uri: currentProfile.avatar.url }
        : DEFAULT_AVATAR;
    } else {
      return meta.value ? { uri: meta.value.path } : DEFAULT_AVATAR;
    }
  }, [meta.value, currentProfile.avatar]);

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo(() => {
    return [
      {
        id: 'remove',
        label: 'Remove Current Photo',
        iconName: 'person-remove-outline',
        disabled: !currentProfile.avatar && !meta.value,
      },
      { id: 'camera', label: 'Take a Photo', iconName: 'camera-outline' },
      {
        id: 'library',
        label: 'Select from Photo Library',
        iconName: 'albums-outline',
      },
    ] as ActionBottomSheetItem[];
  }, [meta.value, currentProfile.avatar]);

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleTakePhoto = async () => {
      try {
        const image = await ImageCropPicker.openCamera({
          mediaType: 'photo',
          cropping: true,
          cropperCircleOverlay: true,
          forceJpg: true,
          width: IMAGE_COMPRESSION_MAX_WIDTH,
          height: IMAGE_COMPRESSION_MAX_HEIGHT,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
        });

        helpers.setValue(image);
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    const handleSelectFromPhotoLibrary = async () => {
      try {
        const image = await ImageCropPicker.openPicker({
          mediaType: 'photo',
          cropping: true,
          cropperCircleOverlay: true,
          forceJpg: true,
          width: IMAGE_COMPRESSION_MAX_WIDTH,
          height: IMAGE_COMPRESSION_MAX_HEIGHT,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: IMAGE_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: IMAGE_COMPRESSION_MAX_HEIGHT,
        });

        helpers.setValue(image);
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    switch (selectedItemId) {
      case 'remove':
        if (currentProfile.avatar === undefined) {
          helpers.setValue(undefined);
        } else {
          helpers.setValue(null);
        }
        break;
      case 'camera':
        await handleTakePhoto();
        break;
      case 'library':
        await handleSelectFromPhotoLibrary();
        break;
    }
  };

  const handlePressAvatar = () => {
    Keyboard.dismiss();
    actionBottomSheetRef.current?.expand();
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressAvatar}
        style={profileAvatarPickerStyles.touchableContainer}>
        <FastImage
          resizeMode="cover"
          style={profileAvatarPickerStyles.image}
          source={avatarSource}
        />
        <View style={profileAvatarPickerStyles.editTextContainer}>
          <Text style={[font.medium, profileAvatarPickerStyles.editText]}>
            Edit
          </Text>
        </View>
      </TouchableOpacity>
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
        onSelectItem={handleSelectActionItem}
      />
    </>
  );
}

const profileAvatarPickerStyles = StyleSheet.create({
  touchableContainer: {
    overflow: 'hidden',
    borderRadius: AVATAR_DIAMETER / 2,
  },
  image: {
    width: AVATAR_DIAMETER,
    height: AVATAR_DIAMETER,
    backgroundColor: color.placeholder,
  },
  editTextContainer: {
    position: 'absolute',
    bottom: 0,
    width: AVATAR_DIAMETER,
    paddingVertical: layout.spacing.xs * 1.5,
    backgroundColor: '#4E4E4E88',
  },
  editText: {
    textAlign: 'center',
    color: color.white,
  },
});
