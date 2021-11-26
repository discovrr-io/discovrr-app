import React, { useContext, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import BottomSheet from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/core';

import * as values from 'src/constants/values';
import { color, font, layout } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { useIsMyProfile, useProfile } from 'src/features/profiles/hooks';
import { selectIsCurrentUserProfile } from 'src/features/authentication/auth-slice';
import {
  useAppDispatch,
  useAppSelector,
  useExtendedTheme,
  useIsMounted,
} from 'src/hooks';
import { Comment, CommentId, Profile } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';
import { alertSomethingWentWrong, shortenLargeNumber } from 'src/utilities';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  Spacer,
} from 'src/components';

import { deleteComment, updateCommentLikeStatus } from './comments-slice';
import { useComment } from './hooks';

const AVATAR_DIAMETER = 32;
const NUMBER_OF_ACTIONS = 3;

type CommentCellContextProps = {
  commentId: CommentId;
  onPressReply?: (comment: Comment, profile: Profile) => void | Promise<void>;
  // onPressMenu?: (comment: Comment) => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
};

const CommentCellContext = React.createContext<CommentCellContextProps>(
  null as any,
);

type CommentCellProps = CommentCellContextProps & {
  commentId: CommentId;
};

export default function CommentCellWrapper(props: CommentCellProps) {
  const commentData = useComment(props.commentId);
  return (
    <CommentCellContext.Provider value={props}>
      <AsyncGate
        data={commentData}
        onPending={() => <CommentCell.Pending />}
        onRejected={() => null}
        onFulfilled={comment => {
          if (!comment) return null;
          return <CommentCell comment={comment} />;
        }}
      />
    </CommentCellContext.Provider>
  );
}

//#region CommentCell ----------------------------------------------------------

const CommentCell = (props: { comment: Comment }) => {
  const profileData = useProfile(props.comment.profileId);
  return (
    <AsyncGate
      data={profileData}
      onPending={() => <CommentCell.Pending />}
      onRejected={() => null}
      onFulfilled={profile => (
        <CommentCellContainer
          AvatarComponent={<CommentCellAvatar profile={profile} />}
          AuthorComponent={<CommentCellAuthor profile={profile} />}
          ContentComponent={
            <CommentCellContent comment={props.comment} profile={profile} />
          }
        />
      )}
    />
  );
};

const CommentCellPending = () => (
  <CommentCellContainer
    AvatarComponent={<CommentCellAvatar />}
    AuthorComponent={<CommentCellAuthor.Pending />}
    ContentComponent={<CommentCellContent.Pending />}
  />
);

CommentCell.Pending = CommentCellPending;

//#endregion CommentCell

//#region CommentCellContainer -------------------------------------------------

type CommentCellContainerProps = {
  AvatarComponent: React.ReactNode;
  AuthorComponent: React.ReactNode;
  ContentComponent: React.ReactNode;
};

function CommentCellContainer(props: CommentCellContainerProps) {
  const { AvatarComponent, AuthorComponent, ContentComponent } = props;
  const { colors } = useExtendedTheme();
  const cellContext = useContext(CommentCellContext);

  return (
    <View style={[commentCellStyles.container, cellContext.style]}>
      {AvatarComponent}
      <Spacer.Horizontal value={layout.spacing.md} />
      <View
        style={[
          commentCellStyles.contentContainer,
          { backgroundColor: colors.placeholder },
        ]}>
        {AuthorComponent}
        <Spacer.Vertical value={layout.spacing.sm} />
        {ContentComponent}
      </View>
    </View>
  );
}

//#endregion CommentCellContainer

//#region CommentCellAvatar ----------------------------------------------------

const CommentCellAvatar = (props: { profile?: Profile }) => {
  const { profile } = props;
  const { colors } = useExtendedTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressAvatar = () => {
    if (!profile) {
      console.error('Cannot navigate to profile because it is undefined.');
      return;
    }

    navigation.push('ProfileDetails', {
      profileIdOrUsername: profile.profileId,
    });
  };

  return (
    <TouchableOpacity
      disabled={!profile}
      activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
      onPress={handlePressAvatar}>
      <FastImage
        source={
          !profile
            ? {} // No source if there is no profile (i.e. when it is loading)
            : profile.avatar
            ? { uri: profile.avatar.url }
            : DEFAULT_AVATAR
        }
        style={[
          commentCellStyles.avatar,
          { backgroundColor: colors.placeholder },
        ]}
      />
    </TouchableOpacity>
  );
};

//#endregion CommentCellAvatar

//#region CommentCellAuthor ----------------------------------------------------

const CommentCellAuthor = (props: { profile?: Profile }) => {
  const { profile } = props;
  const navigation = useNavigation<RootStackNavigationProp>();

  const isMyProfileId = useAppSelector(state => {
    if (!profile) return false;
    return selectIsCurrentUserProfile(state, profile.profileId);
  });

  const handlePressAuthor = () => {
    if (!profile) {
      console.error('Cannot navigate to profile because it is undefined.');
      return;
    }

    navigation.push('ProfileDetails', {
      profileIdOrUsername: profile.profileId,
    });
  };

  return (
    <TouchableOpacity
      disabled={!profile}
      activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
      onPress={handlePressAuthor}
      style={commentCellStyles.authorContainer}>
      <Text
        style={[
          font.smallBold,
          { color: isMyProfileId ? color.accent : color.gray500 },
        ]}>
        {isMyProfileId ? 'You' : profile?.__publicName || 'Anonymous'}
      </Text>
      {profile?.username && (
        <>
          <Spacer.Horizontal value={layout.spacing.sm} />
          <Text style={[font.small, { color: color.gray500 }]}>
            @{profile.username}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

CommentCellAuthor.Pending = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();
  return (
    <View style={commentCellStyles.authorContainer}>
      <View
        style={[
          commentCellStyles.placeholderText,
          { width: '35%', backgroundColor: colors.placeholder },
        ]}
      />
      <Spacer.Horizontal value={layout.spacing.sm} />
      <View
        style={[
          commentCellStyles.placeholderText,
          { width: '20%', backgroundColor: colors.placeholder },
        ]}
      />
    </View>
  );
};

//#endregion CommentCellAuthor

//#region CommentCellContent ---------------------------------------------------

type CommentCellContentProps = {
  comment: Comment;
  profile?: Profile;
};

const CommentCellContent = (props: CommentCellContentProps) => {
  const $FUNC = '[CommentCellContent]';
  const { comment, profile } = props;
  const { didLike, totalLikes } = comment.statistics;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useExtendedTheme();

  const isMounted = useIsMounted();
  const cellContext = useContext(CommentCellContext);
  const isMyProfile = useIsMyProfile(comment.profileId);

  const animatableRef = useRef<Animatable.View & View>(null);
  const actionBottomSheetRef = useRef<BottomSheet>(null);
  const actionBottomSheetItems = useMemo(() => {
    let items: ActionBottomSheetItem[];

    if (isMyProfile) {
      items = [
        {
          id: 'delete',
          label: 'Delete Comment',
          iconName: 'trash-outline',
          destructive: true,
        },
        // { id: 'edit', label: 'Edit Comment', iconName: 'create-outline' },
      ];
    } else {
      items = [
        { id: 'report', label: 'Report Comment', iconName: 'flag-outline' },
      ];
    }

    return items;
  }, [isMyProfile]);

  const [isProcessingLike, setIsProcessingLike] = useState(false);

  const handlePressLike = async () => {
    const newDidLike = !didLike;
    try {
      setIsProcessingLike(true);

      if (newDidLike) {
        // Imperative approach to only animate this if the icon has been pressed
        animatableRef.current?.[values.DEFAULT_ICON_LIKE_ANIMATION]?.();
      }

      const updateLikeStatusCommentAction = updateCommentLikeStatus({
        commentId: comment.id,
        didLike: newDidLike,
      });

      await dispatch(updateLikeStatusCommentAction).unwrap();
    } catch (error) {
      console.error(
        $FUNC,
        `Failed to ${!newDidLike ? 'un' : ''}like post:`,
        error,
      );
      alertSomethingWentWrong();
    } finally {
      if (isMounted.current) setIsProcessingLike(false);
    }
  };

  const handlePressReply = async () => {
    if (!profile) {
      console.warn($FUNC, 'Cannot reply to comment with undefined profile');
      return;
    }

    await cellContext.onPressReply?.(comment, profile);
  };

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleDeleteComment = async () => {
      const commitDeleteComment = async () => {
        try {
          console.log($FUNC, 'Deleting comment...');
          await dispatch(deleteComment({ commentId: comment.id })).unwrap();
        } catch (error: any) {
          console.error($FUNC, 'Failed to delete comment:', error);
          alertSomethingWentWrong(
            error.message ??
              "We weren't able to delete this comment. Please try again later.",
          );
        }
      };

      Alert.alert(
        'Delete comment?',
        'Are you sure you want to delete this comment? This action is irreversible.',
        [
          {
            text: 'Delete',
            style: 'destructive',
            onPress: commitDeleteComment,
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    };

    switch (selectedItemId) {
      case 'delete':
        await handleDeleteComment();
        break;
      case 'report':
        navigation.navigate('ReportItem', {
          screen: 'ReportItemReason',
          params: { type: 'comment' },
        });
        break;
      default:
        actionBottomSheetRef.current?.close();
        break;
    }
  };

  return (
    <View>
      <Text style={[font.small, { color: colors.text }]}>
        {comment.message}
      </Text>

      <Spacer.Vertical value={layout.spacing.md * 0.75} />
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 22 }}>
        <TouchableOpacity
          disabled={isProcessingLike}
          activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
          onPress={handlePressLike}
          style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animatable.View ref={animatableRef}>
            <Icon
              name={didLike ? 'heart' : 'heart-outline'}
              size={21}
              color={didLike ? color.red500 : colors.caption}
            />
          </Animatable.View>
          {totalLikes > 0 && (
            <>
              <Spacer.Horizontal value={layout.spacing.sm} />
              <Text
                style={[
                  font.small,
                  { color: colors.caption },
                  didLike && { color: colors.text },
                ]}>
                {shortenLargeNumber(totalLikes)}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Spacer.Horizontal value={layout.spacing.md * 1.5} />
        <CommentCellActionButton
          name="chatbubble-outline"
          onPress={handlePressReply}
        />
        <Spacer.Horizontal value={layout.spacing.md * 1.5} />
        <CommentCellActionButton
          name="ellipsis-horizontal-outline"
          onPress={() => actionBottomSheetRef.current?.expand()}
        />
      </View>
      <Spacer.Vertical value={layout.spacing.md} />
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
        onSelectItem={handleSelectActionItem}
      />
    </View>
  );
};

const CommentCellContentPending = () => {
  const cellContext = useContext(CommentCellContext);
  const { colors } = useExtendedTheme();

  return (
    <View>
      <View
        style={[
          commentCellStyles.placeholderText,
          { width: '100%', backgroundColor: colors.placeholder },
        ]}
      />
      <Spacer.Vertical value={layout.spacing.md * 0.75} />
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 22 }}>
        {[...Array(NUMBER_OF_ACTIONS)].map((_, idx) => (
          <View
            key={`comment-cell-action-button-placeholder-${cellContext.commentId}-${idx}`}
            style={{ flexDirection: 'row' }}>
            <CommentCellActionButton.Pending />
            {idx < NUMBER_OF_ACTIONS - 1 && (
              <Spacer.Horizontal value={layout.spacing.md * 1.5} />
            )}
          </View>
        ))}
      </View>
      <Spacer.Vertical value={layout.spacing.md} />
    </View>
  );
};

CommentCellContent.Pending = CommentCellContentPending;

//#endregion CommentCellContent

//#region CommentCellActionButton ----------------------------------------------

type CommentCellActionButtonProps = Pick<
  TouchableOpacityProps,
  'disabled' | 'onPress'
> & {
  name: string;
  size?: number;
};

const CommentCellActionButton = (props: CommentCellActionButtonProps) => (
  <TouchableOpacity
    disabled={props.disabled}
    activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
    onPress={props.onPress}>
    <Icon name={props.name} size={props.size ?? 18} color={color.gray500} />
  </TouchableOpacity>
);

CommentCellActionButton.Pending = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();
  return (
    <View
      style={{ width: 18, height: 18, backgroundColor: colors.placeholder }}
    />
  );
};

//#endregion CommentCellActionButton

//#region Styles ---------------------------------------------------------------

const commentCellStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  avatar: {
    width: AVATAR_DIAMETER,
    height: AVATAR_DIAMETER,
    borderRadius: AVATAR_DIAMETER / 2,
  },
  contentContainer: {
    flex: 1,
    borderBottomWidth: 1,
  },
  authorContainer: {
    flexDirection: 'row',
  },
  placeholderText: {
    height: 16.5,
  },
});

//#endregion Styles
