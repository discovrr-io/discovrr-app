import BottomSheet from '@gorhom/bottom-sheet';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useField } from 'formik';

import FastImage, { FastImageProps } from 'react-native-fast-image';
import ImageCropPicker, {
  Image,
  Options,
} from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/Ionicons';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as globalSelectors from 'src/global-selectors';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';
import { useAppSelector, useExtendedTheme } from 'src/hooks';
import { OnboardingStackScreenProps } from 'src/navigation';
import { OnboardingContentContainer, SkipButton } from './components';

const profilePictureForm = yup.object({
  avatar: yup.object().nullable().notRequired(),
});

type ProfilePictureForm = Omit<
  yup.InferType<typeof profilePictureForm>,
  'avatar'
> & {
  avatar?: Image | null;
};

const MAX_IMAGE_HEIGHT = 220;

// TODO: Move these to constants module
const AVATAR_COMPRESSION_QUALITY = 0.7;
const AVATAR_COMPRESSION_MAX_WIDTH =
  constants.media.DEFAULT_AVATAR_DIMENSIONS.width;
const AVATAR_COMPRESSION_MAX_HEIGHT =
  constants.media.DEFAULT_AVATAR_DIMENSIONS.height;

type OnboardingProfilePictureScreenProps =
  OnboardingStackScreenProps<'OnboardingProfilePicture'>;

export default function OnboardingProfilePictureScreen(
  props: OnboardingProfilePictureScreenProps,
) {
  const handleGoToNextScreen = React.useCallback(() => {
    if (Platform.OS === 'ios') {
      props.navigation.navigate('OnboardingPushNotifications');
    } else {
      props.navigation.navigate('OnboardingSurvey');
    }
  }, [props.navigation]);

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => <SkipButton onPress={handleGoToNextScreen} />,
    });
  }, [props.navigation, handleGoToNextScreen]);

  const handleSubmitForm = async (values: ProfilePictureForm) => {
    handleGoToNextScreen();
  };

  return (
    <Formik<ProfilePictureForm>
      initialValues={{
        avatar: undefined,
      }}
      onSubmit={handleSubmitForm}>
      {({ handleSubmit }) => (
        <OnboardingContentContainer
          page={4}
          title="Almost there!"
          body="Let’s set a profile picture so everyone can recognise you. You can always change it later."
          footerActions={[{ title: 'Next', onPress: handleSubmit }]}>
          <ProfilePicturePicker />
        </OnboardingContentContainer>
      )}
    </Formik>
  );
}

function ProfilePicturePicker() {
  const myProfile = useAppSelector(globalSelectors.selectCurrentUserProfile);
  const [_, meta, helpers] = useField<ProfilePictureForm['avatar']>('avatar');

  const { height: windowHeight } = useWindowDimensions();
  const { colors } = useExtendedTheme();

  const { imageHeight, iconDiameter } = React.useMemo(() => {
    const imageHeight = Math.min(MAX_IMAGE_HEIGHT, windowHeight * 0.5);
    const iconDiameter = imageHeight * 0.25;
    return { imageHeight, iconDiameter };
  }, [windowHeight]);

  const [isLoadingImage, setIsLoadingImage] = React.useState(true);
  const avatarSource = React.useMemo<FastImageProps['source']>(() => {
    if (meta.value === undefined) {
      return myProfile?.avatar?.url
        ? { uri: myProfile.avatar.url }
        : constants.media.DEFAULT_AVATAR;
    } else {
      return meta.value
        ? { uri: meta.value.path }
        : constants.media.DEFAULT_AVATAR;
    }
  }, [meta.value, myProfile]);

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo<ActionBottomSheetItem[]>(
    () => [
      { id: 'camera', label: 'Take a Photo', iconName: 'camera-outline' },
      {
        id: 'library',
        label: 'Select from Photo Library',
        iconName: 'albums-outline',
      },
    ],
    [],
  );

  const handleSelectActionItem = async (selectedItemId: string) => {
    const commonImageOptions: Options = {
      mediaType: 'photo',
      forceJpg: true,
      cropping: true,
      cropperCircleOverlay: true,
      width: AVATAR_COMPRESSION_MAX_WIDTH,
      height: AVATAR_COMPRESSION_MAX_HEIGHT,
      compressImageQuality: AVATAR_COMPRESSION_QUALITY,
      compressImageMaxWidth: AVATAR_COMPRESSION_MAX_WIDTH,
      compressImageMaxHeight: AVATAR_COMPRESSION_MAX_HEIGHT,
    };

    const handleTakePhoto = async () => {
      try {
        const image = await ImageCropPicker.openCamera(commonImageOptions);
        helpers.setValue(image);
      } catch (error) {
        utilities.alertImageCropPickerError(error);
      }
    };

    const handleSelectFromPhotoLibrary = async () => {
      try {
        const image = await ImageCropPicker.openPicker(commonImageOptions);
        helpers.setValue(image);
      } catch (error) {
        utilities.alertImageCropPickerError(error);
      }
    };

    setTimeout(async () => {
      switch (selectedItemId) {
        case 'camera':
          await handleTakePhoto();
          break;
        case 'library':
          await handleSelectFromPhotoLibrary();
          break;
      }
    }, constants.values.BOTTOM_SHEET_WAIT_DURATION);
  };

  const handlePressImagePreview = () => {
    actionBottomSheetRef.current?.expand();
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressImagePreview}
        style={{
          aspectRatio: 1,
          height: imageHeight,
          maxHeight: MAX_IMAGE_HEIGHT,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <FastImage
          onLoadStart={() => setIsLoadingImage(true)}
          onLoadEnd={() => setIsLoadingImage(false)}
          source={avatarSource}
          style={{
            flexGrow: 1,
            aspectRatio: 1,
            borderRadius: imageHeight / 2,
            backgroundColor: colors.placeholder,
          }}
        />
        {isLoadingImage && (
          <ActivityIndicator
            size="large"
            color={colors.caption}
            style={{ position: 'absolute' }}
          />
        )}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            aspectRatio: 1,
            height: iconDiameter,
            backgroundColor: colors.primary,
            padding: constants.layout.spacing.md,
            borderRadius: iconDiameter / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon adjustsFontSizeToFit name="camera" size={36} color={'white'} />
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
