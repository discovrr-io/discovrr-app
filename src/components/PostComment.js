import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { colors, typography, values } from '../constants';
import { selectProfileById } from '../features/profile/profilesSlice';

const AVATAR_DIAMETER = 32;
const DEFAULT_ACTIVE_OPACITY = 0.6;

/**
 * @typedef {import('../models').Comment} Comment
 * @typedef {import('react-native').ViewProps} ViewProps
 * @typedef {{ comment: Comment }} PostCommentProps
 * @param {PostCommentProps & ViewProps} param0
 */
export default function PostComment({ comment, ...props }) {
  const navigation = useNavigation();

  const { avatar, fullName } = useSelector((state) =>
    selectProfileById(state, comment.profileId),
  );

  const handlePressAvatar = () => {
    navigation.push('UserProfileScreen', {
      profileId: String(comment.profileId),
    });
  };

  return (
    <View style={[postCommentStyles.container, props.style]}>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressAvatar}>
        <FastImage
          source={avatar}
          style={{
            width: AVATAR_DIAMETER,
            height: AVATAR_DIAMETER,
            borderRadius: AVATAR_DIAMETER / 2,
            marginRight: values.spacing.md,
          }}
        />
      </TouchableOpacity>
      <View style={postCommentStyles.dialogBox}>
        <Text
          style={[
            postCommentStyles.dialogBoxText,
            {
              fontWeight: '700',
              color: colors.gray700,
              marginBottom: values.spacing.sm,
            },
          ]}>
          {fullName}
        </Text>
        <Text style={postCommentStyles.dialogBoxText}>{comment.message}</Text>
      </View>
    </View>
  );
}

const postCommentStyles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    flexDirection: 'row',
    paddingVertical: values.spacing.md,
  },
  dialogBox: {
    flexGrow: 1,
    flexShrink: 1,
    // marginTop: AVATAR_DIAMETER * 0.25,
    padding: values.spacing.sm * 1.5,
    backgroundColor: colors.gray100,
    borderColor: colors.gray,
    borderWidth: values.border.thin,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderBottomLeftRadius: values.radius.md,
  },
  dialogBoxText: {
    color: colors.black,
    fontSize: typography.size.sm,
  },
});
