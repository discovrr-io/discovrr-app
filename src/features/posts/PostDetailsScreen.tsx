import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewProps,
} from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel';
import BottomSheet from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/core';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MediaSource } from 'src/api';
import { Comment, CommentId, Post, Profile } from 'src/models';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { RootStackNavigationProp, RootStackScreenProps } from 'src/navigation';
import { alertSomethingWentWrong } from 'src/utilities';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  Button,
  EmptyContainer,
  ErrorContainer,
  LoadingContainer,
  LoadingOverlay,
  RouteError,
} from 'src/components';

import { color, font, layout } from 'src/constants';
import { DEFAULT_IMAGE_DIMENSIONS } from 'src/constants/media';
import {
  DEFAULT_ACTIVE_OPACITY,
  DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT,
} from 'src/constants/values';

import CommentCell from 'src/features/comments/CommentCell';
import { useIsMyProfile } from 'src/features/profiles/hooks';
import { selectProfileById } from 'src/features/profiles/profiles-slice';
import {
  addCommentForPost,
  fetchCommentsForPost,
  selectCommentsForPost,
} from 'src/features/comments/comments-slice';

import { usePost } from './hooks';
import { deletePost, fetchPostById } from './posts-slice';
import { PostItemCardFooter } from './PostItemCard';

const COMMENT_REPLY_INDICATOR_HEIGHT = 50;
const COMMENT_TEXT_INPUT_MIN_HEIGHT = DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT;
const COMMENT_TEXT_INPUT_MAX_HEIGHT = 230;
const COMMENT_POST_BUTTON_WIDTH = 70;

const ANDROID_SHARE_MESSAGE = `\
Hey there! I want to show you something I found on Discovrr. Download the \
app from the Play Store to view it: \
https://play.google.com/store/apps/details?id=com.discovrr.discovrr_app`;

type SliderImageProps = {
  item: MediaSource;
};

function SliderImage({ item: source }: SliderImageProps) {
  // The default dimensions are probably not ideal, but we'll just have
  // to make sure the `height` and `width` fields are always available when
  // possible.
  const {
    width = DEFAULT_IMAGE_DIMENSIONS.width,
    height = DEFAULT_IMAGE_DIMENSIONS.height,
  } = source;

  return (
    <FastImage
      source={{ uri: source.url }}
      resizeMode="contain"
      style={{
        width: undefined,
        height: undefined,
        aspectRatio: width / height,
        borderRadius: layout.radius.md,
        backgroundColor: color.placeholder,
      }}
    />
  );
}

const PostHeaderComponent = ({ post }: { post: Post }) => {
  const $FUNC = '[PostHeaderComponent]';
  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();
  const isMounted = useIsMounted();

  const isMyProfile = useIsMyProfile(post.profileId);
  const posterProfile = useAppSelector(state => {
    return selectProfileById(state, post.profileId);
  });

  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const actionBottomSheetRef = useRef<BottomSheet>(null);
  const actionBottomSheetItems = useMemo(() => {
    let items: ActionBottomSheetItem[];

    if (isMyProfile) {
      items = [
        {
          id: 'delete',
          label: 'Delete Post',
          iconName: 'trash-outline',
          destructive: true,
        },
        { id: 'edit', label: 'Edit Post', iconName: 'create-outline' },
      ];
    } else {
      items = [
        { id: 'report', label: 'Report Post', iconName: 'flag-outline' },
        {
          id: 'suggest',
          label: 'Suggest Less Like This',
          iconName: 'thumbs-down-outline',
        },
      ];
    }

    return items;
  }, [isMyProfile]);

  const handleSelectActionItem = async (selectedItemId: string) => {
    const handleDeletePost = async () => {
      const commitDeletePost = async () => {
        try {
          setIsDeletingPost(true);
          console.log($FUNC, `Deleting post '${post.id}'...`);
          await dispatch(deletePost({ postId: post.id })).unwrap();
          console.log($FUNC, 'Successfully deleted post');
          navigation.goBack();
        } catch (error: any) {
          console.error($FUNC, 'Failed to delete post:', error);
          alertSomethingWentWrong(
            error.message ??
              "We weren't able to delete this post. Please try again later.",
          );
        } finally {
          if (isMounted.current) setIsDeletingPost(false);
        }
      };

      Alert.alert(
        'Delete post?',
        'Are you sure you want to delete this post? This action is irreversible.',
        [
          { text: 'Delete', style: 'destructive', onPress: commitDeletePost },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    };

    switch (selectedItemId) {
      case 'delete':
        await handleDeletePost();
        break;
      case 'edit':
        navigation.push('EditPost', { postId: post.id });
        break;
      case 'report':
        navigation.navigate('ReportItem', {
          screen: 'ReportItemReason',
          params: { type: 'post' },
        });
        break;
      case 'suggest': /* FALLTHROUGH */
      default:
        actionBottomSheetRef.current?.close();
        break;
    }
  };

  const handlePressShare = async () => {
    try {
      const result = await Share.share(
        Platform.OS === 'ios'
          ? {
              url: 'https://apps.apple.com/au/app/discovrr/id1541137819',
            }
          : {
              title: `Share ${
                posterProfile?.displayName ?? 'this user'
              }'s post`,
              message: ANDROID_SHARE_MESSAGE,
            },
      );

      if (result.action === 'sharedAction') {
        console.log($FUNC, 'Successfully shared post:', result.activityType);
      }
    } catch (error: any) {
      alertSomethingWentWrong(error.message);
    }
  };

  return (
    <View style={{ marginBottom: layout.spacing.md }}>
      <PostDetailsContent post={post} />
      <PostItemCardFooter
        post={post}
        showMenuIcon
        showShareIcon
        onPressMenu={() => actionBottomSheetRef.current?.expand()}
        onPressShare={handlePressShare}
        style={{
          paddingHorizontal: layout.defaultScreenMargins.horizontal,
          paddingBottom: 0,
        }}
      />
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
        onSelectItem={handleSelectActionItem}
      />
      {isDeletingPost && <LoadingOverlay message="Deleting post..." />}
    </View>
  );
};

const AddCommentComponent = () => (
  <View style={{ alignItems: 'center' }}>
    <Text style={[font.mediumBold, { textAlign: 'center' }]}>
      Why not add to the conversation?
    </Text>
    <Text style={[font.small, { textAlign: 'center', color: color.gray500 }]}>
      Reply with your own comment below!
    </Text>
  </View>
);

type PostDetailsScreenWrapperProps = RootStackScreenProps<'PostDetails'>;

export default function PostDetailsScreenWrapper(
  props: PostDetailsScreenWrapperProps,
) {
  const { postId } = props.route.params;
  const postData = usePost(postId);

  return (
    <AsyncGate
      data={postData}
      onPending={() => (
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={{ flexGrow: 1, justifyContent: 'center' }}>
          <LoadingContainer message="Loading post..." />
        </SafeAreaView>
      )}
      onFulfilled={post => {
        if (!post)
          return (
            <RouteError
              message="There doesn't seem to be a post here"
              containerStyle={{ backgroundColor: color.white }}
            />
          );
        return <PostDetailsScreen post={post} />;
      }}
      onRejected={_ => (
        <RouteError containerStyle={{ backgroundColor: color.white }} />
      )}
    />
  );
}

type PostReplyContext =
  | { type: 'post' }
  | { type: 'comment'; recipient: Profile; index?: number }
  | { type: 'comment-reply'; recipient: Profile; index?: number };

type PostDetailsScreenProps = {
  post: Post;
};

function PostDetailsScreen({ post }: PostDetailsScreenProps) {
  const $FUNC = '[PostDetailsScreen]';
  const { bottom: bottomInset } = useSafeAreaInsets();

  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const flatListRef = useRef<FlatList<CommentId>>(null);
  const textInputRef = useRef<TextInput>(null);

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commentTextInput, setCommentTextInput] = useState('');
  const [isProcessingComment, setIsProcessingComment] = useState(false);
  const [replyContext, setReplyContext] = useState<PostReplyContext>({
    type: 'post',
  });

  const commentIds = useAppSelector(st => selectCommentsForPost(st, post.id));

  useEffect(
    () => {
      if (isInitialRender || shouldRefresh)
        (async () => {
          try {
            console.log($FUNC, `Refreshing post '${post.id}'...`);

            const fetchPostAction = fetchPostById({
              postId: post.id,
              reload: true,
            });

            const fetchCommentsAction = fetchCommentsForPost({
              postId: post.id,
              previousCommentIds: commentIds,
            });

            await Promise.all([
              dispatch(fetchPostAction).unwrap(),
              dispatch(fetchCommentsAction).unwrap(),
            ]);
          } catch (error) {
            console.error($FUNC, 'Failed to fetch post details:', error);
            if (isMounted.current) setError(String(error));
          } finally {
            if (isMounted.current) {
              if (isInitialRender) setIsInitialRender(false);
              if (shouldRefresh) setShouldRefresh(false);
            }
          }
        })();
    },
    // We only want to run this effect if the following dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, isInitialRender, shouldRefresh],
  );

  const handleRefresh = async () => {
    if (!isInitialRender && !shouldRefresh) setShouldRefresh(true);
  };

  const handleCommentPressReply = async (
    comment: Comment,
    profile: Profile,
    index: number,
  ) => {
    console.log($FUNC, `handleCommentPressReply(${comment.id}, ${profile.id})`);
    setReplyContext({ type: 'comment', recipient: profile, index });
    textInputRef.current?.focus();
    // Wait for the keyboard to show up...
    await new Promise(resolve => setTimeout(() => resolve(void 0), 500));
    flatListRef.current?.scrollToIndex({ animated: true, index });
  };

  const handleReplyToPost = async () => {
    const addCommentAction = addCommentForPost({
      postId: post.id,
      message: commentTextInput.trim(),
    });

    await dispatch(addCommentAction).unwrap();

    // flatListRef.current?.scrollToEnd({ animated: true });
    flatListRef.current?.scrollToIndex({
      animated: true,
      index: Math.max(0, commentIds.length - 1),
    });
  };

  const handlePressPostButton = async () => {
    try {
      setIsProcessingComment(true);
      switch (replyContext.type) {
        case 'post':
          await handleReplyToPost();
          break;
        default:
          throw new Error(`Unimplemented context: ${replyContext.type}`);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alertSomethingWentWrong();
    } finally {
      if (isMounted.current) {
        setIsProcessingComment(false);
        setCommentTextInput('');
      }
    }
  };

  useEffect(() => {
    if (replyContext.type !== 'post') {
      setCommentTextInput(`@${replyContext.recipient.username} `);
    }
  }, [replyContext]);

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flexGrow: 1, marginBottom: bottomInset }}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 65 + Math.max(0, bottomInset - 8) : -200
        }
        style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={commentIds}
          keyExtractor={item => String(item)}
          indicatorStyle="black"
          contentContainerStyle={{ flexGrow: 1 }}
          ListHeaderComponent={<PostHeaderComponent post={post} />}
          ListHeaderComponentStyle={postDetailsScreenStyles.listHeader}
          ListEmptyComponent={
            isInitialRender ? (
              <LoadingContainer message="Loading comments..." />
            ) : error ? (
              <ErrorContainer message="We weren't able to get the comments for this post. Please try again later." />
            ) : (
              <EmptyContainer message="No comments here. Be the first one!" />
            )
          }
          ListFooterComponent={
            commentIds.length > 0 ? AddCommentComponent : null
          }
          ListFooterComponentStyle={postDetailsScreenStyles.listFooter}
          refreshControl={
            <RefreshControl
              tintColor={color.gray500}
              refreshing={!isInitialRender && shouldRefresh}
              onRefresh={handleRefresh}
            />
          }
          renderItem={({ item: commentId, index }) => (
            <CommentCell
              commentId={commentId}
              onPressReply={(comment, profile) =>
                handleCommentPressReply(comment, profile, index)
              }
              style={[
                postDetailsScreenStyles.commentCell,
                replyContext.type === 'comment' &&
                  index === replyContext.index && {
                    backgroundColor: color.gray100,
                  },
              ]}
            />
          )}
        />
        <View>
          {replyContext.type !== 'post' && (
            <View style={postDetailsScreenStyles.commentBoxIndicator}>
              <Text
                numberOfLines={1}
                style={[
                  font.smallBold,
                  postDetailsScreenStyles.commentBoxIndicatorText,
                ]}>
                Replying to {replyContext.recipient.displayName}…
              </Text>
              <TouchableOpacity
                activeOpacity={DEFAULT_ACTIVE_OPACITY}
                onPress={() => setReplyContext({ type: 'post' })}
                style={postDetailsScreenStyles.commentBoxIndicatorCloseIcon}>
                <Icon name="close" size={24} color={color.gray700} />
              </TouchableOpacity>
            </View>
          )}
          <View style={postDetailsScreenStyles.commentBoxContainer}>
            <TextInput
              ref={textInputRef}
              multiline
              blurOnSubmit
              returnKeyType="done"
              maxLength={300}
              value={commentTextInput}
              onChangeText={setCommentTextInput}
              editable={!isProcessingComment}
              placeholder="Add a comment…"
              placeholderTextColor={color.gray500}
              selectionColor={Platform.OS === 'ios' ? color.accent : undefined}
              style={[
                font.small,
                postDetailsScreenStyles.commentBoxTextInput,
                isProcessingComment && { color: color.gray500 },
                Platform.OS === 'ios' && {
                  paddingTop: layout.spacing.lg * 1.2,
                  paddingBottom: layout.spacing.lg * 1.2,
                  paddingRight: layout.defaultScreenMargins.horizontal * 1.5,
                  minHeight: COMMENT_TEXT_INPUT_MIN_HEIGHT,
                  maxHeight: COMMENT_TEXT_INPUT_MAX_HEIGHT,
                },
              ]}
            />
            <Button
              title="Post"
              type="primary"
              size="small"
              variant="text"
              disabled={commentTextInput.trim().length < 3}
              loading={isProcessingComment}
              onPress={handlePressPostButton}
              containerStyle={postDetailsScreenStyles.commentBoxPostButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const postDetailsScreenStyles = StyleSheet.create({
  listHeader: {
    paddingTop: layout.spacing.md,
  },
  listFooter: {
    paddingTop: layout.spacing.md * 1.5,
    paddingBottom: layout.spacing.lg,
  },
  commentCell: {
    paddingHorizontal: layout.defaultScreenMargins.horizontal,
    paddingTop: layout.spacing.md,
  },
  commentBoxIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.gray100,
    paddingLeft: layout.spacing.md * 1.5,
    height: COMMENT_REPLY_INDICATOR_HEIGHT,
  },
  commentBoxIndicatorText: {
    flexGrow: 1,
    flexShrink: 1,
    color: color.gray700,
  },
  commentBoxIndicatorCloseIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: COMMENT_REPLY_INDICATOR_HEIGHT,
    width: COMMENT_REPLY_INDICATOR_HEIGHT,
  },
  commentBoxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: COMMENT_TEXT_INPUT_MIN_HEIGHT,
    backgroundColor: color.white,
    borderTopWidth: layout.border.thin,
    borderColor: color.gray100,
  },
  commentBoxTextInput: {
    flexGrow: 1,
    flexShrink: 1,
    color: color.black,
    paddingLeft: layout.defaultScreenMargins.horizontal * 1.5,
  },
  commentBoxPostButton: {
    justifyContent: 'center',
    height: COMMENT_TEXT_INPUT_MIN_HEIGHT,
    width: COMMENT_POST_BUTTON_WIDTH,
  },
});

type PostDetailsContentProps = ViewProps & {
  post: Post;
};

function PostDetailsContent(props: PostDetailsContentProps) {
  const { post, ...restProps } = props;
  const { width: screenWidth } = useWindowDimensions();

  const carouselRef = useRef<Carousel<MediaSource> | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const renderPostContent = useCallback(() => {
    switch (post.contents.type) {
      case 'gallery':
        return (
          <View>
            <Carousel
              data={post.contents.sources}
              ref={c => (carouselRef.current = c)}
              // For some reason, the default FlatList implementation doesn't
              // render on initial mount for iOS, so we'll use the ScrollView
              // implementation instead. This isn't required for Android.
              useScrollView={Platform.OS === 'ios'}
              sliderWidth={screenWidth}
              itemWidth={screenWidth * 0.85}
              onSnapToItem={setActiveMediaIndex}
              contentContainerCustomStyle={{ alignItems: 'center' }}
              renderItem={({ item }) => <SliderImage item={item} />}
            />
            <Pagination
              activeDotIndex={activeMediaIndex}
              dotsLength={post.contents.sources.length}
              dotStyle={{
                width: 10,
                height: 10,
                borderRadius: 5,
                marginBottom: layout.spacing.sm,
                backgroundColor: color.gray700,
              }}
              containerStyle={{
                paddingTop: layout.spacing.lg,
                paddingBottom: 0,
              }}
            />
            <Text
              style={[
                font.medium,
                postDetailsContentStyles.caption,
                post.location && { marginBottom: 0 },
              ]}>
              {post.contents.caption}
            </Text>
          </View>
        );
      case 'video':
        return (
          <Text style={[font.large, { textAlign: 'center' }]}>[VIDEO]</Text>
        );
      case 'text': /* FALLTHROUGH */
      default:
        return (
          <View style={postDetailsContentStyles.dialogBox}>
            <Text style={[font.large, postDetailsContentStyles.dialogBoxText]}>
              {post.contents.text}
            </Text>
          </View>
        );
    }
  }, [activeMediaIndex, screenWidth, post]);

  return (
    <View style={[restProps.style]}>
      {renderPostContent()}
      {post.location && (
        <Text
          style={[
            font.small,
            {
              color: color.gray500,
              marginHorizontal: layout.defaultScreenMargins.horizontal * 1.5,
              marginTop: layout.spacing.xs * 1.5,
              marginBottom: layout.spacing.md,
            },
          ]}>
          {post.location.text}
        </Text>
      )}
    </View>
  );
}

const postDetailsContentStyles = StyleSheet.create({
  dialogBox: {
    paddingHorizontal: layout.defaultScreenMargins.horizontal * 1.5,
    marginBottom: layout.spacing.md,
  },
  dialogBoxText: {
    color: color.black,
  },
  caption: {
    marginVertical: layout.spacing.md * 1.5,
    marginHorizontal: layout.defaultScreenMargins.horizontal * 1.5,
  },
});
