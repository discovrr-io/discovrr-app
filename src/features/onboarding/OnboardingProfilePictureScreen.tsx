import BottomSheet from '@gorhom/bottom-sheet';
import * as React from 'react';
import {
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { ActionBottomSheet, ActionBottomSheetItem } from 'src/components';

import * as constants from 'src/constants';
import * as globalSelectors from 'src/global-selectors';
import { useAppSelector, useExtendedTheme } from 'src/hooks';
import { OnboardingStackScreenProps } from 'src/navigation';
import { OnboardingContentContainer, SkipButton } from './components';

const MAX_IMAGE_HEIGHT = 220;

type OnboardingProfilePictureScreenProps =
  OnboardingStackScreenProps<'OnboardingProfilePicture'>;

export default function OnboardingProfilePictureScreen(
  props: OnboardingProfilePictureScreenProps,
) {
  const myProfile = useAppSelector(globalSelectors.selectCurrentUserProfile);

  const { height: windowHeight } = useWindowDimensions();
  const { colors } = useExtendedTheme();

  const { imageHeight, iconDiameter } = React.useMemo(() => {
    const imageHeight = Math.min(MAX_IMAGE_HEIGHT, windowHeight * 0.5);
    const iconDiameter = imageHeight * 0.25;
    return { imageHeight, iconDiameter };
  }, [windowHeight]);

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

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => <SkipButton onPress={() => {}} />,
    });
  }, [props.navigation]);

  const handlePressImagePreview = () => {
    actionBottomSheetRef.current?.expand();
  };

  const handlePressNext = async () => {
    if (Platform.OS === 'ios') {
      props.navigation.navigate('OnboardingPushNotifications');
    } else {
      props.navigation.navigate('OnboardingSurvey');
    }
  };

  return (
    <OnboardingContentContainer
      page={4}
      title="Almost there!"
      body="Let’s set a profile picture so everyone can recognise you. You can always change it later."
      footerActions={[{ title: 'Next', onPress: handlePressNext }]}>
      <TouchableOpacity
        activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressImagePreview}
        style={{
          aspectRatio: 1,
          height: imageHeight,
          maxHeight: MAX_IMAGE_HEIGHT,
          alignSelf: 'center',
        }}>
        <FastImage
          source={
            myProfile?.avatar
              ? { uri: myProfile.avatar.url }
              : constants.media.DEFAULT_AVATAR
          }
          style={{
            flexGrow: 1,
            backgroundColor: colors.placeholder,
            borderRadius: imageHeight / 2,
          }}
        />
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
      />
    </OnboardingContentContainer>
  );
}
