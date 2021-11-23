import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

import * as yup from 'yup';
import BottomSheet from '@gorhom/bottom-sheet';
import FastImage, { FastImageProps, ImageStyle } from 'react-native-fast-image';
import Video, { VideoProperties } from 'react-native-video';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';
import { useSharedValue } from 'react-native-reanimated';

import ImageCropPicker, {
  Image,
  ImageOrVideo,
  Options,
} from 'react-native-image-crop-picker';

import * as utilities from 'src/utilities';
import * as globalSelectors from 'src/global-selectors';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { AuthApi, MediaSource, ProfileApi } from 'src/api';
import { useMyProfileId, useProfile } from 'src/features/profiles/hooks';
import { Profile, ProfileId } from 'src/models';
import { RootStackScreenProps } from 'src/navigation';

import * as constants from 'src/constants';
import { DEFAULT_AVATAR, DEFAULT_IMAGE } from 'src/constants/media';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import {
  DEFAULT_ACTIVE_OPACITY,
  MAX_VID_DURATION_MILLISECONDS,
  MAX_VID_DURATION_SECONDS,
} from 'src/constants/values';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  Button,
  Card,
  Cell,
  LoadingContainer,
  LoadingOverlay,
  RouteError,
  SelectFromLibraryBottomSheet,
  Spacer,
} from 'src/components';

import {
  useAppDispatch,
  useAppSelector,
  useIsMounted,
  useNavigationAlertUnsavedChangesOnRemove,
} from 'src/hooks';

const MAX_INPUT_LENGTH = 30;
const MAX_BUSINESS_NAME_LENGTH = MAX_INPUT_LENGTH * 2;
const MAX_BIO_LENGTH = 140;
const AVATAR_DIAMETER = 100;
const AVATAR_BOTTOM_OFFSET_DIVISOR = 3.2;

const IMAGE_COMPRESSION_QUALITY = 0.7;
const AVATAR_COMPRESSION_MAX_WIDTH =
  constants.media.DEFAULT_AVATAR_DIMENSIONS.width;
const AVATAR_COMPRESSION_MAX_HEIGHT =
  constants.media.DEFAULT_AVATAR_DIMENSIONS.height;
const BACKGROUND_COMPRESSION_MAX_WIDTH = 400;
const BACKGROUND_COMPRESSION_MAX_HEIGHT = 500;

const profileChangesSchema = yup.object({
  avatar: yup.object().nullable().notRequired(),
  background: yup.object().nullable().notRequired(),
  displayName: yup
    .string()
    .trim()
    .required('Please enter your name')
    .min(3, 'Your display name should have at least 3 characters')
    .max(
      MAX_INPUT_LENGTH,
      `Your display name should be no longer than ${MAX_INPUT_LENGTH} characters`,
    ),
  businessName: yup
    .string()
    .trim()
    .min(3, 'Your business name should have at least 3 characters')
    .max(
      MAX_BUSINESS_NAME_LENGTH,
      `Your business name should be no longer than ${MAX_BUSINESS_NAME_LENGTH} characters`,
    ),
  username: yup
    .string()
    .trim()
    .required('Please enter a unique username')
    .min(3, 'Your username should have at least 3 characters')
    .max(
      MAX_INPUT_LENGTH,
      `Your username should not be more than ${MAX_INPUT_LENGTH} characters`,
    )
    .matches(constants.regex.USERNAME_REGEX, {
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
  'avatar' | 'background'
> & {
  /**
   * If set to `undefined`, the user has NOT changed their current avatar (and
   * so it doesn't need to be uploaded). Otherwise, explicitly set it to `null`
   * to remove the current avatar.
   */
  avatar?: Image | null;
  background?: ImageOrVideo | null;
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
  const profile = props.profile;

  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [overlayContent, setOverlayContent] = React.useState<{
    message?: string;
    caption?: string;
    isUploading?: boolean;
    canCancel?: boolean;
  }>({
    message: 'Getting ready…',
    caption: "This won't take long",
    isUploading: false,
    canCancel: false,
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
      let processedBackground: MediaSource | null | undefined = undefined;
      let processedBackgroundThumbnail: MediaSource | null | undefined =
        undefined;

      if (changes.avatar !== undefined) {
        console.log($FUNC, 'Removing current avatar...');
        processedAvatar = null;

        // First, remove it from the Firebase profile
        await auth().currentUser?.updateProfile({ photoURL: null });

        // Then delete it from Firebase Cloud Storage
        if (profile.avatar) {
          try {
            const filePath =
              profile.avatar.path ||
              `/profiles/avatars/${profile.avatar.filename}`;
            if (filePath) {
              console.log(
                $FUNC,
                'Deleting old avatar from Cloud Storage:',
                filePath,
              );
              const reference = storage().ref(filePath);
              await reference.delete();
            } else {
              console.warn($FUNC, 'There is no way to delete the old avatar');
            }
          } catch (error) {
            // We'll just continue on if this fails
            console.error('Failed to delete old avatar from Firebase:', error);

            try {
              console.warn(
                $FUNC,
                'Resorting to deleting profile avatar from legacy directory...',
              );
              const reference = storage().ref(
                `/avatars/${profile.avatar?.filename}`,
              );
              await reference.delete();
            } catch (error) {
              // We'll just continue on if this fails
              console.error(
                'Failed to delete old avatar from legacy directory:',
                error,
              );
            }
          }
        }
      }

      if (changes.background !== undefined) {
        console.log($FUNC, 'Removing current background...');
        processedBackground = null;
        processedBackgroundThumbnail = null;

        if (profile.background) {
          try {
            const filePath = profile.background.path;
            if (filePath) {
              console.log(
                $FUNC,
                'Deleting old background from Cloud Storage:',
                filePath,
              );
              const reference = storage().ref(filePath);
              await reference.delete();
            } else {
              console.warn(
                $FUNC,
                'There is no way to delete the old background',
              );
            }
          } catch (error) {
            // We'll just continue on if this fails
            console.error(
              'Failed to delete old background from Firebase:',
              error,
            );
          }
        }

        if (profile.backgroundThumbnail) {
          try {
            const filePath = profile.backgroundThumbnail.path;
            if (filePath) {
              console.log(
                $FUNC,
                'Deleting old background thumbnail from Cloud Storage:',
                filePath,
              );
              const reference = storage().ref(filePath);
              await reference.delete();
            } else {
              console.warn(
                $FUNC,
                'There is no way to delete the old background thumbnail',
              );
            }
          } catch (error) {
            // We'll just continue on if this fails
            console.error(
              'Failed to delete old background thumbnail from Firebase:',
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

        const avatarSource = utilities.mapImageToMediaSource(changes.avatar);

        const [filename, task, reference] =
          utilities.createFirebaseUploadFileTask(
            avatarSource,
            ({ filename }) => `/profiles/avatars/${filename}`,
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
          ...avatarSource,
          filename,
          url: avatarDownloadURL,
          path: reference.fullPath,
        };
      }

      if (changes.background) {
        let backgroundSource: MediaSource;
        let backgroundThumbnailSource: MediaSource;

        if (changes.background.mime.includes('video')) {
          const uncompressed = utilities.mapVideoToMediaSource(
            // @ts-ignore We'll ignore the fact that duration may not exist (it
            // can be undefined anyway)
            changes.background,
          );

          console.log($FUNC, 'Generating thumbnail for background...');
          setOverlayContent({
            message: 'Generating thumbnail…',
            caption: `This won't take long`,
            canCancel: true,
          });

          backgroundThumbnailSource = await utilities.generateThumbnail(
            uncompressed,
          );

          console.log($FUNC, 'Uploading thumbnail for background...');
          setOverlayContent({
            message: 'Uploading thumbnail…',
            caption: `This won't take too long`,
            isUploading: true,
          });

          const [thumbnailFilename, thumbnailTask, thumbnailReference] =
            utilities.createFirebaseUploadFileTask(
              backgroundThumbnailSource,
              ({ filename }) => `/profiles/background-thumbnails/${filename}`,
            );

          thumbnailTask.on('state_changed', snapshot => {
            currentUploadProgress.value =
              snapshot.bytesTransferred / snapshot.totalBytes;
          });

          await thumbnailTask.then(() => {
            console.log($FUNC, 'Successfully uploaded background thumbnail');
          });

          processedBackgroundThumbnail = {
            ...backgroundThumbnailSource,
            filename: thumbnailFilename,
            url: await thumbnailReference.getDownloadURL(),
            path: thumbnailReference.fullPath,
          };

          console.log($FUNC, 'Compressing background...');
          setOverlayContent({
            message: 'Compressing video…',
            caption: 'This may take a while',
            canCancel: true,
          });

          const timer = setTimeout(() => {
            if (isMounted.current)
              setOverlayContent(prev => ({
                ...prev,
                caption: 'This is taking longer than usual…',
              }));
          }, 20 * 1000);

          backgroundSource = await utilities.compressVideo(uncompressed, 400);

          clearTimeout(timer);
        } else {
          backgroundSource = utilities.mapImageToMediaSource(
            changes.background,
          );
        }

        console.log($FUNC, 'Uploading background...');
        setOverlayContent({
          message: 'Uploading background',
          caption: 'This may take a while',
          isUploading: true,
        });

        const [videoFilename, videoTask, videoReference] =
          utilities.createFirebaseUploadFileTask(
            backgroundSource,
            ({ filename, isVideo }) =>
              `/profiles/backgrounds/${
                isVideo ? 'videos' : 'images'
              }/${filename}`,
          );

        videoTask.on('state_changed', snapshot => {
          currentUploadProgress.value =
            snapshot.bytesTransferred / snapshot.totalBytes;
        });

        await videoTask.then(() => {
          console.log($FUNC, 'Successfully uploaded background');
        });

        processedBackground = {
          ...backgroundSource,
          filename: videoFilename,
          url: await videoReference.getDownloadURL(),
          path: videoReference.fullPath,
        };
      }

      setOverlayContent({ message: 'Saving your changes…' });

      const changedDisplayName = changes.displayName.trim();
      const processedDisplayName =
        profile.displayName !== changedDisplayName
          ? changedDisplayName
          : undefined;

      let processedBusinessName: string | undefined = undefined;
      if (profile.kind === 'vendor') {
        const changedBusinessName = changes.businessName?.trim();
        if (profile.businessName !== changedBusinessName) {
          processedBusinessName = changedBusinessName;
        }
      }

      const changedUsername = changes.username.trim();
      const processedUsername =
        profile.username !== changedUsername ? changedUsername : undefined;

      const changedBiography = changes.biography?.trim();
      const processedBiography =
        profile.biography !== changedBiography ? changedBiography : undefined;

      // Finally, we update the profile (with the new avatar if changed).
      const updateProfileAction = profilesSlice.updateProfile({
        profileId: profile.profileId,
        // If any of these fields are `undefined`, it will be ignored by Redux
        // and the backend.
        changes: {
          avatar: processedAvatar,
          background: processedBackground,
          backgroundThumbnail: processedBackgroundThumbnail,
          displayName: processedDisplayName,
          username: processedUsername,
          biography: processedBiography,
          businessName: processedBusinessName,
        },
      });

      // Maybe show a custom toast notification here
      await dispatch(updateProfileAction).unwrap();
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

  const handleCancel = React.useCallback(async () => {
    console.log('Cancelling tasks...');
    await FFmpegKit.cancel();
  }, []);

  return (
    <ProfileSettingsFormContext.Provider value={{ currentProfile: profile }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            constants.layout.defaultScreenStyle,
            { flexGrow: 1 },
          ]}>
          <Formik<ProfileChangesForm>
            initialValues={{
              avatar: undefined,
              background: undefined,
              displayName: profile.displayName,
              businessName:
                profile.kind === 'vendor' ? profile.businessName : undefined,
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
          onCancel={overlayContent.canCancel ? handleCancel : undefined}
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

  const currentProfileKind = useAppSelector(
    globalSelectors.selectCurrentUserProfileKind,
  );

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
              marginRight: constants.layout.defaultScreenMargins.horizontal,
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
        <ProfileBackgroundPicker />
        <ProfileAvatarPicker
          containerStyle={[
            {
              position: 'absolute',
              bottom: -(AVATAR_DIAMETER / AVATAR_BOTTOM_OFFSET_DIVISOR),
              left: constants.layout.spacing.lg,
            },
          ]}
        />
      </View>
      <Spacer.Vertical value={AVATAR_DIAMETER / AVATAR_BOTTOM_OFFSET_DIVISOR} />
      <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING * 2} />
      <Cell.Group
        label="My Details"
        elementOptions={{
          containerSpacingHorizontal: constants.layout.spacing.md * 1.25,
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
          {currentProfileKind === 'vendor' && (
            <Cell.Input
              label="Business"
              placeholder="Enter your business name"
              value={values.businessName}
              onChangeText={handleChange('businessName')}
              onBlur={handleBlur('businessName')}
              error={errors.businessName}
            />
          )}
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
                  color={constants.color.accent}
                  style={{ width: 24 }}
                />
              ) : (
                <Cell.Input.Icon
                  name="reload-outline"
                  color={constants.color.accent}
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
          destructive
          label="Deactivate my account"
          iconName="person-remove-outline"
        />
      </Cell.Group>
    </>
  );
}

type ProfileBackgroundPickerSource =
  | { type: 'image'; source: FastImageProps['source'] }
  | { type: 'video'; source: VideoProperties['source'] };

function ProfileBackgroundPicker() {
  const { currentProfile } = React.useContext(ProfileSettingsFormContext);
  const [_, meta, helpers] =
    useField<ProfileChangesForm['background']>('background');

  const [isLoading, setIsLoading] = React.useState(true);

  const backgroundSource: ProfileBackgroundPickerSource = React.useMemo(() => {
    if (meta.value === undefined) {
      return currentProfile.background?.url
        ? {
            type: currentProfile.background.mime.includes('video')
              ? 'video'
              : 'image',
            source: { uri: currentProfile.background.url },
          }
        : { type: 'image', source: DEFAULT_IMAGE };
    } else {
      return meta.value
        ? {
            type: meta.value.mime.includes('video') ? 'video' : 'image',
            source: { uri: meta.value.path },
          }
        : { type: 'image', source: DEFAULT_IMAGE };
    }
  }, [meta.value, currentProfile.background]);

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const selectFromLibraryBottomSheetRef = React.useRef<BottomSheet>(null);

  const actionBottomSheetItems = React.useMemo(() => {
    return [
      {
        id: 'remove',
        label: `Remove Current ${
          backgroundSource.type === 'video' ? 'Video' : 'Photo'
        }`,
        iconName: 'trash-outline',
        disabled: !currentProfile.background && !meta.value,
      },
      { id: 'camera-photo', label: 'Take a Photo', iconName: 'camera-outline' },
      {
        id: 'camera-video',
        label: 'Take a Video',
        iconName: 'videocam-outline',
      },
      {
        id: 'library',
        label: 'Select from Photo Library',
        iconName: 'albums-outline',
      },
    ] as ActionBottomSheetItem[];
  }, [meta.value, currentProfile.background, backgroundSource.type]);

  const handlePressBackground = () => {
    Keyboard.dismiss();
    selectFromLibraryBottomSheetRef.current?.close();
    actionBottomSheetRef.current?.expand();
  };

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleTakePhoto = async () => {
      try {
        const image = await ImageCropPicker.openCamera({
          mediaType: 'photo',
          cropping: true,
          forceJpg: true,
          width: BACKGROUND_COMPRESSION_MAX_WIDTH,
          height: BACKGROUND_COMPRESSION_MAX_HEIGHT,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: BACKGROUND_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: BACKGROUND_COMPRESSION_MAX_HEIGHT,
        });

        helpers.setValue(image);
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    const handleRecordVideo = async () => {
      try {
        utilities.alertUnavailableFeature();
        // await ImageCropPicker.openCamera({
        //   mediaType: 'video',
        // });
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    switch (selectedItemId) {
      case 'remove':
        if (currentProfile.background === undefined) {
          helpers.setValue(undefined);
        } else {
          helpers.setValue(null);
        }
        break;
      case 'camera-photo':
        await handleTakePhoto();
        break;
      case 'camera-video':
        await handleRecordVideo();
        break;
      case 'library':
        selectFromLibraryBottomSheetRef.current?.expand();
        break;
    }
  };

  const handleSelectUploadTypeAction = async (selectedItemId: string) => {
    const handleSelectFromPhotoLibrary = async (options: Options) => {
      try {
        const imageOrVideo = await ImageCropPicker.openPicker({
          width: BACKGROUND_COMPRESSION_MAX_WIDTH,
          height: BACKGROUND_COMPRESSION_MAX_HEIGHT,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: BACKGROUND_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: BACKGROUND_COMPRESSION_MAX_HEIGHT,
          ...options,
        });

        if (
          // @ts-ignore The `duration` field may be present for videos
          imageOrVideo.duration &&
          // @ts-ignore
          imageOrVideo.duration > MAX_VID_DURATION_MILLISECONDS
        ) {
          Alert.alert(
            'Video Will Be Trimmed',
            'This video is longer than the maximum video duration of ' +
              `${MAX_VID_DURATION_SECONDS} seconds. It will be trimmed ` +
              'when you upload it.',
          );
        }

        helpers.setValue(imageOrVideo);
      } catch (error: any) {
        utilities.alertImageCropPickerError(error);
      }
    };

    switch (selectedItemId) {
      case 'photo':
        await handleSelectFromPhotoLibrary({
          mediaType: 'photo',
          forceJpg: true,
          cropping: true,
          loadingLabelText: 'Processing photo…',
        });
        break;
      case 'video':
        await handleSelectFromPhotoLibrary({
          mediaType: 'video',
          loadingLabelText: 'Processing video…',
        });
        break;
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressBackground}
        style={{ alignItems: 'center', justifyContent: 'center' }}>
        {backgroundSource.type === 'image' ? (
          <FastImage
            resizeMode="cover"
            source={backgroundSource.source}
            style={[profileBackgroundPickerStyles.picker]}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
          />
        ) : (
          <Video
            repeat
            muted
            playWhenInactive
            resizeMode="cover"
            source={backgroundSource.source}
            style={[profileBackgroundPickerStyles.picker]}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
          />
        )}
        <Card.Indicator
          iconName="brush"
          position="top-right"
          elementOptions={{ smallContent: true }}
        />
        {isLoading && (
          <ActivityIndicator
            size="large"
            color={constants.color.gray500}
            style={{ position: 'absolute' }}
          />
        )}
      </TouchableOpacity>
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
        onSelectItem={handleSelectActionItem}
      />
      <SelectFromLibraryBottomSheet
        ref={selectFromLibraryBottomSheetRef}
        onSelectItem={handleSelectUploadTypeAction}
      />
    </>
  );
}

const profileBackgroundPickerStyles = StyleSheet.create({
  picker: {
    width: '100%',
    aspectRatio: 3 / 1.8,
    backgroundColor: constants.color.placeholder,
    borderRadius: constants.layout.radius.md,
  },
});

type ProfileAvatarPickerProps = {
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

function ProfileAvatarPicker(props: ProfileAvatarPickerProps) {
  const { currentProfile } = React.useContext(ProfileSettingsFormContext);
  const [_, meta, helpers] = useField<ProfileChangesForm['avatar']>('avatar');

  const [containerWidth, setContainerWidth] = React.useState(100);

  const avatarSource: FastImageProps['source'] = React.useMemo(() => {
    if (meta.value === undefined) {
      return currentProfile.avatar?.url
        ? { uri: currentProfile.avatar.url }
        : DEFAULT_AVATAR;
    } else {
      return meta.value ? { uri: meta.value.path } : DEFAULT_AVATAR;
    }
  }, [meta.value, currentProfile.avatar]);

  const handlePressAvatar = () => {
    Keyboard.dismiss();
    actionBottomSheetRef.current?.expand();
  };

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo(() => {
    return [
      {
        id: 'remove',
        label: 'Remove Current Photo',
        iconName: 'trash-outline',
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
          width: AVATAR_COMPRESSION_MAX_WIDTH,
          height: AVATAR_COMPRESSION_MAX_HEIGHT,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: AVATAR_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: AVATAR_COMPRESSION_MAX_HEIGHT,
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
          width: AVATAR_COMPRESSION_MAX_WIDTH,
          height: AVATAR_COMPRESSION_MAX_HEIGHT,
          compressImageQuality: IMAGE_COMPRESSION_QUALITY,
          compressImageMaxWidth: AVATAR_COMPRESSION_MAX_WIDTH,
          compressImageMaxHeight: AVATAR_COMPRESSION_MAX_HEIGHT,
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

  return (
    <>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressAvatar}
        onLayout={({ nativeEvent }) =>
          setContainerWidth(nativeEvent.layout.width)
        }
        style={[
          profileAvatarPickerStyles.touchableContainer,
          { borderRadius: containerWidth / 2 },
          props.containerStyle,
        ]}>
        <FastImage
          resizeMode="cover"
          source={avatarSource}
          style={[profileAvatarPickerStyles.image, props.imageStyle]}
        />
        <View style={profileAvatarPickerStyles.editTextContainer}>
          <Text
            style={[constants.font.medium, profileAvatarPickerStyles.editText]}>
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
    borderWidth: 6,
    borderColor: constants.color.white,
  },
  image: {
    width: AVATAR_DIAMETER,
    aspectRatio: 1,
    borderRadius: AVATAR_DIAMETER / 2,
    backgroundColor: constants.color.placeholder,
  },
  editTextContainer: {
    position: 'absolute',
    bottom: 0,
    width: AVATAR_DIAMETER,
    paddingVertical: constants.layout.spacing.xs * 1.5,
    backgroundColor: '#4E4E4E88',
  },
  editText: {
    textAlign: 'center',
    color: constants.color.white,
  },
});
