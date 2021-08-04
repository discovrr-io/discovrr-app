import React, { useMemo } from 'react';
import { SafeAreaView, Text, View, ViewProps } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  BottomSheetBackdropProps,
  BottomSheetModal,
  TouchableHighlight,
} from '@gorhom/bottom-sheet';

import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { colors, typography, values } from '../../constants';

type ActionModalItemProps = ViewProps & {
  label: string;
  iconName: string;
  onPress?: () => void | Promise<void>;
};

function ActionModalItem(props: ActionModalItemProps) {
  const { label, iconName, onPress } = props;
  return (
    <TouchableHighlight
      underlayColor={colors.gray100}
      onPress={onPress}
      style={{ borderRadius: values.radius.md }}>
      <View
        style={{
          flexGrow: 1,
          flexDirection: 'row',
          alignItems: 'center',
          padding: values.spacing.md,
        }}>
        <Icon
          name={iconName}
          size={28}
          color={colors.black}
          style={{ marginEnd: values.spacing.md * 1.5 }}
        />
        <Text style={{ fontSize: typography.size.h4 }}>{label}</Text>
      </View>
    </TouchableHighlight>
  );
}

type ActionModalSheetProps = {
  snapPoints?: (string | number)[];
  children: React.ReactNode;
};

function ActionModalSheetModalBackdrop(props: BottomSheetBackdropProps) {
  const { animatedIndex, style } = props;

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 0.5],
      [0, 0.5],
      Extrapolate.CLAMP,
    ),
  }));

  const containerStyle = useMemo(
    () => [style, { backgroundColor: colors.black }, containerAnimatedStyle],
    [style, containerAnimatedStyle],
  );

  return <Animated.View style={containerStyle} />;
}

const ActionModalSheet = (
  props: ActionModalSheetProps,
  ref: React.ForwardedRef<BottomSheetModal>,
) => {
  const { snapPoints = [], children } = props;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={ActionModalSheetModalBackdrop}>
      <SafeAreaView
        style={{
          flex: 1,
          marginHorizontal: values.spacing.md,
          marginBottom: values.spacing.lg,
        }}>
        {children}
      </SafeAreaView>
    </BottomSheetModal>
  );
};

type __ActionModal = React.ForwardRefExoticComponent<
  ActionModalSheetProps & React.RefAttributes<BottomSheetModal>
> & {
  Item: typeof ActionModalItem;
};

const ActionModal = React.forwardRef<BottomSheetModal, ActionModalSheetProps>(
  ActionModalSheet,
) as __ActionModal;

ActionModal.Item = ActionModalItem;

export default ActionModal;
