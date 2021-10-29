import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

import * as yup from 'yup';
import BottomSheet from '@gorhom/bottom-sheet';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';
import { useSharedValue } from 'react-native-reanimated';

import ImageCropPicker, {
  Image,
  PickerErrorCode,
} from 'react-native-image-crop-picker';

import * as utilities from 'src/utilities';
import { MediaSource, ProfileApi } from 'src/api';
import { updateProfile } from 'src/features/profiles/profiles-slice';
import { useMyProfileId, useProfile } from 'src/features/profiles/hooks';
import { Profile, ProfileId } from 'src/models';
import { RootStackScreenProps } from 'src/navigation';

import { color, font, layout } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import { CELL_ICON_SIZE } from 'src/components/cells/common';

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
  useIsMounted,
  // useNavigationAlertUnsavedChangesOnRemove,
} from 'src/hooks';

const MAX_INPUT_LENGTH = 30;
const MAX_BIO_LENGTH = 140;
const AVATAR_DIAMETER = 130;

const IMAGE_COMPRESSION_QUALITY = 0.7;
const IMAGE_COMPRESSION_MAX_WIDTH = 200;
const IMAGE_COMPRESSION_MAX_HEIGHT = 200;

const profileChangesSchema = yup.object({
  avatar: yup.object().nullable().notRequired(),
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

type ProfileChangesForm = Omit<
  yup.InferType<typeof profileChangesSchema>,
  'avatar'
> & {
  avatar?: Image | null;
};

type ProfileSettingsProps = RootStackScreenProps<'ProfileSettings'>;

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
  const dispatch = useAppDispatch();
  const profile = props.profile;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // const [isUploading, setIsUploading] = React.useState(false);
  // const [overlayMessage, setOverlayMessage] = React.useState<string>();
  // const [overlayCaption, setOverlayCaption] = React.useState<string>();

  const [overlayContent, setOverlayContent] = React.useState<{
    message?: string;
    caption?: string;
    isUploading?: boolean;
  }>({ caption: "This won't take long", isUploading: false });

  const currentUploadProgress = useSharedValue(0);

  const handleSaveChanges = async (changes: ProfileChangesForm) => {
    try {
      setIsSubmitting(true);

      let processedAvatar: MediaSource | null = null;
      if (changes.avatar !== undefined) {
        // We'll remove the current avatar even if we're uploading a new one
        console.log($FUNC, 'Removing current avatar...');
        setOverlayContent({ message: 'Processing changes…' });
        await auth().currentUser?.updateProfile({ photoURL: null });

        const oldProfileAvatarFilename = profile.avatar?.filename;
        if (oldProfileAvatarFilename) {
          console.log(
            $FUNC,
            'Deleting old profile avatar file:',
            oldProfileAvatarFilename,
          );

          try {
            const reference = storage().ref(
              `/avatars/${oldProfileAvatarFilename}`,
            );
            await reference.delete();
          } catch (error) {
            console.error(
              'Failed to delete old profile image from Firebase:',
              error,
            );
          }
        }

        if (changes.avatar) {
          console.log($FUNC, 'Uploading avatar...');
          setOverlayContent({
            message: 'Uploading avatar…',
            caption: 'This may take a while',
            isUploading: true,
          });

          const source: MediaSource = {
            mime: changes.avatar.mime,
            url: changes.avatar.path,
            size: changes.avatar.size,
            width: changes.avatar.width,
            height: changes.avatar.height,
          };

          const [filename, task, reference] = utilities.uploadFileToFirebase(
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

          if (firebaseCurrentUser) {
            setOverlayContent({
              message: 'Applying avatar…',
              isUploading: false,
            });

            await firebaseCurrentUser.updateProfile({
              photoURL: avatarDownloadURL,
            });
          } else {
            console.warn(
              $FUNC,
              'Firebase user is null, which is unexpected.',
              'Skipping profile update...',
            );
          }

          processedAvatar = {
            ...source,
            filename,
            url: avatarDownloadURL,
            path: undefined,
          };
        }
      }

      setOverlayContent({ message: 'Saving profile changes…' });

      const updateProfileAction = updateProfile({
        profileId: profile.profileId,
        changes: {
          avatar: processedAvatar,
          displayName: changes.displayName?.trim(),
          username: changes.username?.trim(),
          biography: changes.biography?.trim(),
        },
      });

      await dispatch(updateProfileAction).unwrap();

      Alert.alert(
        'Profile Updated',
        'Your changes has been successfully saved',
      );
    } catch (error) {
      console.error($FUNC, 'Failed to update profile:', error);
      utilities.alertSomethingWentWrong(
        "We weren't able to update your profile at the moment. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
      currentUploadProgress.value = 0;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[layout.defaultScreenStyle, { flexGrow: 1 }]}>
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior="position">
            <Formik<ProfileChangesForm>
              initialValues={{
                avatar: undefined,
                displayName: profile.displayName,
                username: profile.username,
                biography: profile.biography,
              }}
              enableReinitialize={true}
              validationSchema={profileChangesSchema}
              onSubmit={handleSaveChanges}>
              <ProfileSettingsForm profile={profile} />
            </Formik>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </ScrollView>
      {isSubmitting && (
        <LoadingOverlay
          message={overlayContent.message}
          caption={overlayContent.caption}
          progress={
            overlayContent.isUploading ? currentUploadProgress : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const $FUNC = '[ProfileSettingsForm]';
  const navigation = useNavigation<ProfileSettingsProps['navigation']>();
  const isMounted = useIsMounted();

  const [selection, setSelection] = React.useState('user');
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
  } = useFormikContext<ProfileApi.ProfileChanges>();

  const handleGenerateRandomUsername = async () => {
    try {
      setIsGeneratingUsername(true);
      const username = await ProfileApi.generateRandomUsername();
      setFieldValue('username', username);
    } catch (error) {
      console.error($FUNC, 'Failed to generate random username:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "We weren't able to generate a username for you. Please try again later.",
      );
    } finally {
      if (isMounted.current) setIsGeneratingUsername(false);
    }
  };

  // useNavigationAlertUnsavedChangesOnRemove(dirty);

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

  return (
    <>
      <View style={{ alignItems: 'center' }}>
        <ProfileAvatarPicker avatar={profile.avatar} />
      </View>
      <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING * 2} />
      <Cell.Group
        label="Profile details"
        elementOptions={{
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

type ProfileAvatarPicker = {
  avatar?: MediaSource;
};

function ProfileAvatarPicker(props: ProfileAvatarPicker) {
  const $FUNC = '[ProfileAvatarPicker]';
  const [_, meta, helpers] = useField<ProfileChangesForm['avatar']>('avatar');

  React.useEffect(() => {
    console.log($FUNC, 'AVATAR:', meta.value);
  }, [meta.value]);

  const avatarSource: FastImageProps['source'] = React.useMemo(() => {
    if (meta.value === undefined) {
      return props.avatar?.url ? { uri: props.avatar.url } : DEFAULT_AVATAR;
    } else {
      return meta.value ? { uri: meta.value.path } : DEFAULT_AVATAR;
    }
  }, [meta.value, props.avatar]);

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo(() => {
    return [
      {
        id: 'remove',
        label: 'Remove Current Photo',
        iconName: 'person-remove-outline',
        disabled: meta.value === null,
      },
      { id: 'camera', label: 'Take a Photo', iconName: 'camera-outline' },
      {
        id: 'library',
        label: 'Select from Photo Library',
        iconName: 'albums-outline',
      },
    ] as ActionBottomSheetItem[];
  }, [meta.value]);

  const handleSelectActionItem = async (selectedItemId: string) => {
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
        if (error.code === ('E_PICKER_CANCELLED' as PickerErrorCode)) return;
        const { title, message } =
          utilities.constructAlertFromImageCropPickerError(error);
        Alert.alert(title, message);
      }
    };

    switch (selectedItemId) {
      case 'remove':
        helpers.setValue(null);
        break;
      // case 'camera':
      //   break;
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
        style={editProfileAvatarStyles.touchableContainer}>
        <FastImage
          resizeMode="cover"
          style={editProfileAvatarStyles.image}
          source={avatarSource}
        />
        <View style={editProfileAvatarStyles.editTextContainer}>
          <Text style={[font.medium, editProfileAvatarStyles.editText]}>
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

const editProfileAvatarStyles = StyleSheet.create({
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
