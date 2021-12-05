import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel';
import BottomSheet from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import Video, { OnLoadData, VideoProperties } from 'react-native-video';
import { useFocusEffect, useNavigation } from '@react-navigation/core';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { MediaSource } from 'src/api';
import { RootStackNavigationProp, RootStackScreenProps } from 'src/navigation';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  Button,
  EmptyContainer,
  ErrorContainer,
  GlobalAutolink,
  LoadingContainer,
  LoadingOverlay,
  RouteError,
  SignInPrompt,
} from 'src/components';

import {
  useAppDispatch,
  useAppSelector,
  useExtendedTheme,
  useIsMounted,
} from 'src/hooks';

import {
  Comment,
  CommentId,
  GalleryPostContents,
  Post,
  Profile,
  VideoPostContents,
} from 'src/models';

import CommentCell from 'src/features/comments/CommentCell';
import { useIsMyProfile } from 'src/features/profiles/hooks';

import { usePost } from './hooks';
import { PostItemCardFooter } from './PostItemCard';

import * as commentsSlice from 'src/features/comments/comments-slice';
import * as postsSlice from './posts-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';

const COMMENT_POST_BUTTON_WIDTH = 70;
const COMMENT_REPLY_INDICATOR_HEIGHT = 50;
const COMMENT_TEXT_INPUT_MAX_HEIGHT = 230;
const COMMENT_TEXT_INPUT_MIN_HEIGHT =
  constants.values.DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT;

const MEDIA_WIDTH_SCALE = 0.85;

const ANDROID_SHARE_MESSAGE =
  'Hey there! I want to show you something I found on Discovrr. Download ' +
  'the app from the Play Store to view it: ' +
  constants.values.ANDROID_PLAY_STORE_LINK;

type SliderImageProps = {
  item: MediaSource;
};

function SliderImage({ item: source }: SliderImageProps) {
  // The default dimensions are probably not ideal, but we'll just have
  // to make sure the `height` and `width` fields are always available when
  // possible.
  const {
    width = constants.media.DEFAULT_IMAGE_DIMENSIONS.width,
    height = constants.media.DEFAULT_IMAGE_DIMENSIONS.height,
  } = source;

  const { colors } = useExtendedTheme();

  return (
    <FastImage
      source={{ uri: source.url }}
      resizeMode="contain"
      style={{
        width: undefined,
        height: undefined,
        aspectRatio: width / height,
        borderRadius: constants.layout.radius.md,
        backgroundColor: colors.placeholder,
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
    return profilesSlice.selectProfileById(state, post.profileId);
  });

  const [isDeletingPost, setIsDeletingPost] = React.useState(false);

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo(() => {
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
          await dispatch(postsSlice.deletePost({ postId: post.id })).unwrap();
          console.log($FUNC, 'Successfully deleted post');
          navigation.goBack();
        } catch (error: any) {
          console.error($FUNC, 'Failed to delete post:', error);
          utilities.alertSomethingWentWrong(
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
          ? { url: 'https://apps.apple.com/au/app/discovrr/id1541137819' }
          : {
              title: `Share ${
                posterProfile?.__publicName ?? 'this user'
              }'s post`,
              message: ANDROID_SHARE_MESSAGE,
            },
      );

      if (result.action === 'sharedAction') {
        console.log($FUNC, 'Successfully shared post:', result.activityType);
      }
    } catch (error: any) {
      utilities.alertSomethingWentWrong(error.message);
    }
  };

  return (
    <View style={{ marginBottom: constants.layout.spacing.md }}>
      <PostDetailsContent post={post} />
      <PostItemCardFooter
        post={post}
        showMenuIcon
        showShareIcon
        onPressMenu={() => actionBottomSheetRef.current?.expand()}
        onPressShare={handlePressShare}
        style={{
          paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
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

function AddCommentComponent() {
  const navigation = useNavigation<RootStackNavigationProp>();

  const currentUser = useAppSelector(state => state.auth.user);
  const { colors } = useExtendedTheme();

  const handleSignIn = () => {
    navigation.navigate('AuthPrompt', { screen: 'AuthStart' });
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          constants.font.mediumBold,
          { textAlign: 'center', color: colors.text },
        ]}>
        {currentUser
          ? 'Why not add to the conversation?'
          : 'Want to add to the conversation?'}
      </Text>
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          constants.font.small,
          { textAlign: 'center', color: colors.caption },
        ]}>
        {currentUser
          ? 'Reply with your own comment below!'
          : 'Sign in to get the most out of Discovrr.'}
      </Text>
      {!currentUser && (
        <Button
          title="Sign In"
          size="medium"
          variant="contained"
          onPress={handleSignIn}
          containerStyle={{
            marginTop: constants.layout.spacing.md,
            marginBottom: constants.layout.spacing.lg,
          }}
        />
      )}
    </View>
  );
}

type PostDetailsScreenProps = RootStackScreenProps<'PostDetails'>;

export default function PostDetailsScreen(props: PostDetailsScreenProps) {
  const { postId, focusCommentBox } = props.route.params;
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
          return <RouteError message="There doesn't seem to be a post here" />;
        return (
          <LoadedPostDetailsScreen
            post={post}
            focusCommentBox={focusCommentBox}
          />
        );
      }}
      onRejected={_ => <RouteError />}
    />
  );
}

type PostReplyContext =
  | { type: 'post' }
  | { type: 'comment'; recipient: Profile; index?: number }
  | { type: 'comment-reply'; recipient: Profile; index?: number };

type LoadedPostDetailsScreenProps = {
  post: Post;
  focusCommentBox?: boolean;
};

function LoadedPostDetailsScreen(props: LoadedPostDetailsScreenProps) {
  const $FUNC = '[PostDetailsScreen]';
  const { post, focusCommentBox } = props;

  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const { bottom: bottomInset } = useSafeAreaInsets();
  const { colors } = useExtendedTheme();

  const currentUser = useAppSelector(state => state.auth.user);

  const flatListRef = React.useRef<FlatList<CommentId>>(null);
  const textInputRef = React.useRef<TextInput>(null);

  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [commentTextInput, setCommentTextInput] = React.useState('');
  const [isProcessingComment, setIsProcessingComment] = React.useState(false);
  const [replyContext, setReplyContext] = React.useState<PostReplyContext>({
    type: 'post',
  });

  const commentIds = useAppSelector(state => {
    return commentsSlice.selectCommentsForPost(state, post.id);
  });

  React.useEffect(() => {
    // FIXME: Keyboard avoiding view doesn't work nicely on Android
    if (Platform.OS === 'ios' && focusCommentBox) {
      textInputRef.current?.focus();
    }
  }, [focusCommentBox]);

  React.useEffect(
    () => {
      if (isInitialRender || shouldRefresh)
        (async () => {
          try {
            console.log($FUNC, `Refreshing post '${post.id}'...`);

            const fetchPostAction = postsSlice.fetchPostById({
              postId: post.id,
              reload: true,
            });

            const fetchCommentsAction = commentsSlice.fetchCommentsForPost({
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
    const addCommentAction = commentsSlice.addCommentForPost({
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
      utilities.alertSomethingWentWrong();
    } finally {
      if (isMounted.current) {
        setIsProcessingComment(false);
        setCommentTextInput('');
      }
    }
  };

  React.useEffect(() => {
    if (replyContext.type !== 'post') {
      setCommentTextInput(`@${replyContext.recipient.username} `);
    }
  }, [replyContext]);

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        flexGrow: 1,
        marginBottom: bottomInset,
        backgroundColor: colors.card,
      }}>
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
          contentContainerStyle={{ flexGrow: 1 }}
          ListHeaderComponent={<PostHeaderComponent post={post} />}
          ListHeaderComponentStyle={postDetailsScreenStyles.listHeader}
          ListEmptyComponent={
            isInitialRender ? (
              <LoadingContainer
                message="Loading comments..."
                containerStyle={{ backgroundColor: colors.card }}
              />
            ) : error ? (
              <ErrorContainer
                message="We weren't able to get the comments for this post. Please try again later."
                containerStyle={{ backgroundColor: colors.card }}
              />
            ) : currentUser ? (
              <EmptyContainer
                message="No comments here. Be the first one!"
                containerStyle={{ backgroundColor: colors.card }}
              />
            ) : (
              <SignInPrompt title="Want to add a comment?" />
            )
          }
          ListFooterComponent={
            commentIds.length > 0 ? AddCommentComponent : null
          }
          ListFooterComponentStyle={postDetailsScreenStyles.listFooter}
          refreshControl={
            <RefreshControl
              tintColor={constants.color.gray500}
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
                    backgroundColor: colors.highlight,
                  },
              ]}
            />
          )}
        />
        <View>
          {replyContext.type !== 'post' && (
            <View
              style={[
                postDetailsScreenStyles.commentReplyIndicator,
                { backgroundColor: colors.highlight },
              ]}>
              <Text
                numberOfLines={1}
                style={[
                  constants.font.smallBold,
                  postDetailsScreenStyles.commentBoxIndicatorText,
                  { color: colors.text },
                ]}>
                Replying to {replyContext.recipient.__publicName}…
              </Text>
              <TouchableOpacity
                activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
                onPress={() => setReplyContext({ type: 'post' })}
                style={postDetailsScreenStyles.commentBoxIndicatorCloseIcon}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
          {currentUser && (
            <View
              style={[
                postDetailsScreenStyles.commentBoxContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}>
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
                placeholderTextColor={constants.color.gray500}
                selectionColor={
                  Platform.OS === 'ios' ? constants.color.accent : undefined
                }
                style={[
                  constants.font.small,
                  { color: colors.text },
                  postDetailsScreenStyles.commentBoxTextInput,
                  isProcessingComment && { color: constants.color.gray500 },
                  Platform.OS === 'ios' && {
                    paddingTop: constants.layout.spacing.lg * 1.2,
                    paddingBottom: constants.layout.spacing.lg * 1.2,
                    paddingRight:
                      constants.layout.defaultScreenMargins.horizontal * 1.5,
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
                innerTextProps={{ maxFontSizeMultiplier: 1.2 }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const postDetailsScreenStyles = StyleSheet.create({
  listHeader: {
    paddingTop: constants.layout.spacing.md,
  },
  listFooter: {
    paddingTop: constants.layout.spacing.md * 1.5,
    paddingBottom: constants.layout.spacing.lg,
  },
  commentCell: {
    paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
    paddingTop: constants.layout.spacing.md,
  },
  commentReplyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: constants.layout.spacing.md * 1.5,
    height: COMMENT_REPLY_INDICATOR_HEIGHT,
  },
  commentBoxIndicatorText: {
    flexGrow: 1,
    flexShrink: 1,
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentBoxTextInput: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: constants.layout.defaultScreenMargins.horizontal * 1.5,
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

  const renderPostContent = React.useCallback(() => {
    switch (post.contents.type) {
      case 'gallery':
        return (
          <GalleryPostDetailsContent
            contents={post.contents}
            location={post.location}
          />
        );
      case 'video':
        return (
          <VideoPostDetailsContent
            contents={post.contents}
            location={post.location}
          />
        );
      case 'text': /* FALLTHROUGH */
      default:
        return (
          <View style={postDetailsContentStyles.textPostContainer}>
            <GlobalAutolink
              text={post.contents.text}
              textProps={{ style: [constants.font.large] }}
            />
          </View>
        );
    }
  }, [post.contents, post.location]);

  return (
    <View style={[restProps.style]}>
      {renderPostContent()}
      {post.location && (
        <Text
          style={[
            constants.font.small,
            {
              color: constants.color.gray500,
              marginHorizontal:
                constants.layout.defaultScreenMargins.horizontal * 1.5,
              marginTop: constants.layout.spacing.xs * 1.5,
              marginBottom: constants.layout.spacing.md,
            },
          ]}>
          {post.location.text}
        </Text>
      )}
    </View>
  );
}

const postDetailsContentStyles = StyleSheet.create({
  textPostContainer: {
    paddingHorizontal: constants.layout.defaultScreenMargins.horizontal * 1.5,
    marginBottom: constants.layout.spacing.md,
  },
});

type GalleryPostDetailsContentProps = {
  contents: GalleryPostContents;
  location?: Post['location'];
};

function GalleryPostDetailsContent(props: GalleryPostDetailsContentProps) {
  const { contents, location } = props;
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useExtendedTheme();

  const carouselRef = React.useRef<Carousel<MediaSource> | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = React.useState(0);

  return (
    <View>
      <Carousel
        data={contents.sources}
        ref={c => (carouselRef.current = c)}
        // For some reason, the default FlatList implementation doesn't
        // render on initial mount for iOS, so we'll use the ScrollView
        // implementation instead. This isn't required for Android.
        useScrollView={Platform.OS === 'ios'}
        sliderWidth={windowWidth}
        itemWidth={windowWidth * 0.85}
        onSnapToItem={setActiveMediaIndex}
        contentContainerCustomStyle={{ alignItems: 'center' }}
        renderItem={({ item }) => <SliderImage item={item} />}
      />
      <Pagination
        activeDotIndex={activeMediaIndex}
        dotsLength={contents.sources.length}
        dotColor={colors.caption}
        inactiveDotColor={colors.captionDisabled}
        dotStyle={{
          width: 10,
          height: 10,
          borderRadius: 5,
          marginBottom: constants.layout.spacing.sm,
          backgroundColor: constants.color.gray700,
        }}
        containerStyle={{
          paddingTop: constants.layout.spacing.lg,
          paddingBottom: 0,
        }}
      />
      <PostDetailsContentCaption
        caption={contents.caption}
        style={[location && { marginBottom: 0 }]}
      />
    </View>
  );
}

type VideoPostDetailsContentProps = {
  contents: VideoPostContents;
  location?: Post['location'];
};

function VideoPostDetailsContent(props: VideoPostDetailsContentProps) {
  const { contents, location } = props;
  const { width: windowWidth } = useWindowDimensions();

  // const videoRef = React.useRef<Video>(null);
  // const [isLoading, setIsLoading] = React.useState(true);
  // const [isPaused, setIsPaused] = React.useState(false);

  const aspectRatio = React.useMemo(() => {
    const { width = 1, height = 1 } = contents.source;
    return width / height;
  }, [contents.source]);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     return () => {
  //       console.log('PAUSING');
  //       setIsPaused(true);
  //     };
  //   }, []),
  // );

  const handlePressVideo = () => {
    // if (Platform.OS !== 'android') return;
    // videoRef.current?.presentFullscreenPlayer();
  };

  return (
    <View>
      <TouchableWithoutFeedback onPress={handlePressVideo}>
        <VideoPlayer
          repeat
          resizeMode="cover"
          ignoreSilentSwitch="ignore"
          source={{ uri: contents.source.url }}
          videoPlayerStyle={{
            aspectRatio,
            width: windowWidth * MEDIA_WIDTH_SCALE,
          }}
        />
      </TouchableWithoutFeedback>
      <PostDetailsContentCaption
        caption={contents.caption}
        style={[location && { marginBottom: 0 }]}
      />
    </View>
  );
}

const videoPostDetailsContentStyle = StyleSheet.create({
  videoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    borderRadius: constants.layout.radius.md,
  },
  activityIndicator: {
    position: 'absolute',
    transform: [{ scale: 1.5 }],
  },
});

type VideoPlayerProps = Omit<VideoProperties, 'style'> & {
  containerStyle?: StyleProp<ViewStyle>;
  videoPlayerStyle?: StyleProp<ViewStyle>;
};

function VideoPlayer(props: VideoPlayerProps) {
  const { containerStyle, videoPlayerStyle, onLoad, ...videoProps } = props;
  const { colors } = useExtendedTheme();

  const videoRef = React.useRef<Video>(null);
  const [showLoading, setShowLoading] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);

  const handleOnLoad = React.useCallback(
    (data: OnLoadData) => {
      onLoad?.(data);
      setShowLoading(false);
    },
    [onLoad],
  );

  useFocusEffect(
    React.useCallback(() => {
      return () => setIsPaused(true);
    }, []),
  );

  return (
    <View style={[videoPostDetailsContentStyle.videoContainer, containerStyle]}>
      <Video
        {...videoProps}
        ref={videoRef}
        paused={isPaused}
        onLoad={handleOnLoad}
        controls={Platform.OS === 'ios'} // Only show controls on iOS for now
        style={[
          videoPostDetailsContentStyle.video,
          { backgroundColor: colors.placeholder },
          videoPlayerStyle,
        ]}
      />
      {showLoading && (
        <ActivityIndicator
          size="large"
          color={constants.color.gray500}
          style={videoPostDetailsContentStyle.activityIndicator}
        />
      )}
    </View>
  );
}

type PostDetailsContentCaptionProps = {
  caption: string;
  style?: StyleProp<ViewStyle>;
};

function PostDetailsContentCaption(props: PostDetailsContentCaptionProps) {
  return (
    <View style={[postDetailsContentCaptionStyles.captionContainer]}>
      <GlobalAutolink
        text={props.caption}
        textProps={{ style: [constants.font.medium, props.style] }}
      />
    </View>
  );
}

const postDetailsContentCaptionStyles = StyleSheet.create({
  captionContainer: {
    marginVertical: constants.layout.spacing.md * 1.5,
    marginHorizontal: constants.layout.defaultScreenMargins.horizontal * 1.5,
  },
});
