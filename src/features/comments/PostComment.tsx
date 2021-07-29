import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';

import { colors, typography, values } from '../../constants';
import { useAppSelector } from '../../hooks';
import { CommentId } from '../../models';
import {
  selectCurrentUser,
  selectCurrentUserProfileId,
} from '../authentication/authSlice';
import { selectProfileById } from '../profiles/profilesSlice';
import { selectCommentById } from './commentsSlice';
import { DEFAULT_AVATAR } from '../../constants/media';

const AVATAR_DIAMETER = 32;
const DEFAULT_ACTIVE_OPACITY = 0.6;

type PostCommentProps = ViewProps & {
  commentId: CommentId;
};

export default function PostComment(props: PostCommentProps) {
  const { commentId, ...restProps } = props;

  const navigation = useNavigation();

  const comment = useAppSelector((state) =>
    selectCommentById(state, commentId),
  );

  if (!comment) {
    console.warn('[Comment] Failed to select comment with id:', commentId);
    return null;
  }

  const { avatar = DEFAULT_AVATAR, fullName = 'Anonymous' } =
    useAppSelector((state) => selectProfileById(state, comment.profileId)) ??
    {};

  const currentUserProfileId = useAppSelector(selectCurrentUserProfileId);
  const isMyComment = comment.profileId === currentUserProfileId;

  const handlePressAvatar = () => {
    // @ts-ignore
    navigation.push('UserProfileScreen', {
      profileId: String(comment.profileId),
      profileName: fullName,
    });
  };

  return (
    <View style={[postCommentStyles.container, restProps.style]}>
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
              marginBottom: values.spacing.xs,
            },
            isMyComment && { color: colors.accent },
          ]}>
          {isMyComment ? 'You' : fullName}
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
    paddingVertical: values.spacing.sm,
  },
  dialogBox: {
    flexGrow: 1,
    flexShrink: 1,
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
