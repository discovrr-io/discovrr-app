import React from 'react';
import {
  useWindowDimensions,
  FlatList,
  KeyboardAvoidingView,
  LogBox,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import OneSignal from 'react-native-onesignal';
import * as Animatable from 'react-native-animatable';

import { connect, useDispatch } from 'react-redux';
import * as reduxActions from './utilities/Actions';

import {
  Button,
  EmptyTabView,
  ErrorTabView,
  LoadingTabView,
  PostItemKind,
} from './components';
import { colors, values, typography } from './constants';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const Parse = require('parse/react-native');

const POST_DETAIL_ICON_SIZE = 32;
const AVATAR_DIAMETER = POST_DETAIL_ICON_SIZE;
const TEXT_INPUT_HEIGHT = 35;
const DEFAULT_ACTIVE_OPACITY = 0.6;

async function fetchPostDetails(postId) {
  const postQuery = new Parse.Query(Parse.Object.extend('Post'));
  postQuery.equalTo('objectId', postId);

  const post = await postQuery.first();

  const currentUser = await Parse.User.currentAsync();
  const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
  profileQuery.equalTo('owner', currentUser);

  const profileResult = await profileQuery.first();

  let likesCount = 0;
  let hasLiked = false;
  const likersArray = post.get('likersArray');
  if (Array.isArray(likersArray) && likersArray.length) {
    likesCount = likersArray.length;
    hasLiked = likersArray.some((liker) => profileResult.id === liker);
    // console.log({ hasLiked });
  }

  return {
    author: {
      id: post.get('profile')?.id,
      ownerId: post.get('profile')?.get('owner')?.id,
      name: post.get('profile')?.get('name') ?? 'Anonymous',
      avatar: post.get('profile')?.get('avatar'),
      description: post.get('profile')?.get('description'),
      followersCount: post.get('profile')?.get('followersCount'),
      followingCount: post.get('profile')?.get('followingCount'),
      coverPhoto: post.get('profile')?.get('coverPhoto'),
    },
    metrics: {
      likesCount,
      hasLiked,
      hasSaved: false, // TODO
    },
  };
}

async function fetchPostComments(postDetails, dispatch) {
  const { id: postId } = postDetails;
  const postPointer = {
    __type: 'Pointer',
    className: 'Post',
    objectId: postId,
  };

  const query = new Parse.Query(Parse.Object.extend('PostComment'));
  query.equalTo('post', postPointer);
  query.include('profile');

  const results = await query.find();
  const comments = results.map((comment) => {
    return {
      id: comment.id,
      comment: comment.get('message'),
      createdAt: comment.get('createdAt'),
      author: {
        id: comment.get('profile')?.id,
        name: comment.get('profile')?.get('name') ?? 'Anonymous',
        avatar: comment.get('profile')?.get('avatar'),
      },
    };
  });

  if (Array.isArray(comments) && comments.length) {
    dispatch(reduxActions.updateComments(postId, comments));
  }

  return comments;
}

const SliderImage = ({ item }) => {
  const itemSource = item.url ? { uri: item.url } : imagePlaceholder;

  // TODO: work on this code
  if (item.type === 'video') {
    return (
      <Video
        paused
        allowsExternalPlayback={false}
        resizeMode="cover"
        source={{
          uri: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        }}
        style={{
          aspectRatio: item.width / item.height,
          borderRadius: values.radius.md,
        }}
      />
    );
  } else {
    return (
      <FastImage
        style={{
          aspectRatio: item.width / item.height,
          borderRadius: values.radius.md,
        }}
        source={itemSource}
        resizeMode={FastImage.resizeMode.cover}
      />
    );
  }
};

const PostDetailContent = ({ postDetails, ...props }) => {
  const carouselRef = React.useRef(null);
  const { width: screenWidth } = useWindowDimensions();

  const [activeMediaIndex, setActiveMediaIndex] = React.useState(0);

  return (
    <View style={[props.style]}>
      {(() => {
        switch (postDetails.postType) {
          case PostItemKind.MEDIA:
            return (
              <View>
                <Carousel
                  useScrollView
                  contentContainerCustomStyle={{ alignItems: 'center' }}
                  ref={(c) => (carouselRef.current = c)}
                  data={postDetails.media}
                  sliderWidth={screenWidth}
                  itemWidth={screenWidth * 0.85}
                  renderItem={({ item }) => <SliderImage item={item} />}
                  onSnapToItem={(index) => setActiveMediaIndex(index)}
                />
                <Pagination
                  containerStyle={{
                    paddingTop: values.spacing.lg,
                    paddingBottom: 0,
                  }}
                  dotsLength={postDetails.media.length}
                  activeDotIndex={activeMediaIndex}
                  dotStyle={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginHorizontal: values.spacing.sm,
                    backgroundColor: colors.gray700,
                  }}
                  inactiveDotStyle={{ backgroundColor: colors.gray300 }}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
                <Text style={postDetailContentStyles.caption}>
                  {postDetails.caption ?? ''}
                </Text>
              </View>
            );
          case PostItemKind.TEXT: /* FALLTHROUGH */
          default:
            return (
              <View style={postDetailContentStyles.dialogBox}>
                <Text style={postDetailContentStyles.dialogBoxText}>
                  {postDetails.caption ?? ''}
                </Text>
              </View>
            );
        }
      })()}
    </View>
  );
};

const postDetailContentStyles = StyleSheet.create({
  dialogBox: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md * 1.5,
    marginHorizontal: values.spacing.md,
  },
  dialogBoxText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: typography.size.md,
  },
  caption: {
    fontSize: typography.size.md,
    marginTop: values.spacing.md * 1.5,
    marginHorizontal: values.spacing.md,
  },
});

const PostDetailFooter = ({
  postDetails,
  // isRefreshingMetrics = false,
  // setIsRefreshingMetrics = () => {},
  ...props
}) => {
  const navigation = useNavigation();

  const [author, setAuthor] = React.useState(postDetails.author);
  const [metrics, setMetrics] = React.useState(postDetails.metrics);

  const [isProcessingLike, setIsProcessingLike] = React.useState(false);
  const [isProcessingSave, setIsProcessingSave] = React.useState(false);

  const [hasSaved, setHasSaved] = React.useState(metrics.hasLiked);
  const [hasLiked, setHasLiked] = React.useState(metrics.hasLiked);
  const [likesCount, setLikesCount] = React.useState(metrics.likesCount);

  const avatarSource = author.avatar?.url
    ? { uri: author.avatar.url }
    : defaultAvatar;

  // React.useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const newPostDetails = await fetchPostDetails(postDetails.id);
  //       console.log({ metrics, newMetrics: newPostDetails.metrics });
  //       setAuthor({ ...author, ...newPostDetails.author });
  //       setMetrics({ ...metrics, ...newPostDetails.metrics });
  //     } catch (error) {
  //       console.error(`Failed to refresh metrics: ${error}`);
  //     }

  //     setIsRefreshingMetrics(false);
  //   };

  //   if (isRefreshingMetrics || !author || !metrics) fetchData();
  // }, []);

  const handlePressAvatar = () => {
    navigation.navigate('UserProfileScreen', {
      userProfile: author,
      metrics: metrics,
    });
  };

  const handlePressShare = async () => {
    console.warn('Unimplemented: handlePressShare');
  };

  const handlePressSave = async () => {
    setHasSaved((prev) => !prev);
  };

  const handlePressLike = async () => {
    const oldHasLiked = hasLiked;
    const oldLikesCount = likesCount;
    setIsProcessingLike(true);

    try {
      setHasLiked(!oldHasLiked);
      setLikesCount((prev) => Math.max(0, prev + (!oldHasLiked ? 1 : -1)));

      console.log('Sending notification...');
      OneSignal.postNotification(
        JSON.stringify({
          include_player_ids: ['3976c91b-5460-4002-b0d1-e7babf5e5249'],
          headings: { en: 'Ta-Seen liked a post (not your one, yet...)' },
          contents: { en: '(This was not a manual notification)' },
        }),
        (success) => {
          console.log('ONESIGNAL SUCCESS:', success);
        },
        (error) => {
          console.log('ONESIGNAL FAILURE:', error);
        },
      );

      await Parse.Cloud.run('likeOrUnlikePost', {
        postId: postDetails.id,
        like: !oldHasLiked,
      });

      console.log(`Successfully ${!oldHasLiked ? 'liked' : 'unliked'} post`);
    } catch (error) {
      setHasLiked(oldHasLiked);
      setLikesCount(oldLikesCount);

      Alert.alert('Sorry, something went wrong. Please try again later.');
      console.error(
        `Failed to ${!oldHasLiked ? 'like' : 'unlike'} post: ${error}`,
      );
    }

    setIsProcessingLike(false);
  };

  return (
    <View style={[postDetailsFooterStyles.container, props.style]}>
      {postDetails.location && (
        <Text style={postDetailsFooterStyles.location}>
          {postDetails.location.text}
        </Text>
      )}
      <View style={postDetailsFooterStyles.footerContainer}>
        <TouchableOpacity style={{ flexGrow: 1 }} onPress={handlePressAvatar}>
          <View style={postDetailsFooterStyles.authorContainer}>
            <FastImage
              width={AVATAR_DIAMETER}
              height={AVATAR_DIAMETER}
              style={postDetailsFooterStyles.avatar}
              source={avatarSource}
            />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={postDetailsFooterStyles.authorName}>
              {/* TODO: This overflows if name is too long */}
              {author?.name?.length ? author.name : 'Anonymous'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={postDetailsFooterStyles.metricsContainer}>
          <TouchableOpacity
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={handlePressShare}>
            <MaterialIcon
              style={postDetailsFooterStyles.actionButton}
              name="share"
              color={colors.gray}
              size={POST_DETAIL_ICON_SIZE}
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isProcessingSave}
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={handlePressSave}>
            <MaterialIcon
              style={postDetailsFooterStyles.actionButton}
              name={hasSaved ? 'bookmark' : 'bookmark-outline'}
              color={hasSaved ? colors.black : colors.gray}
              size={POST_DETAIL_ICON_SIZE}
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isProcessingLike}
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={handlePressLike}>
            <Animatable.View
              key={hasLiked.toString()}
              animation={hasLiked ? 'bounceIn' : undefined}>
              <MaterialIcon
                style={[
                  postDetailsFooterStyles.actionButton,
                  { marginRight: values.spacing.md },
                ]}
                name={hasLiked ? 'favorite' : 'favorite-border'}
                color={hasLiked ? 'red' : colors.gray}
                size={POST_DETAIL_ICON_SIZE}
              />
            </Animatable.View>
          </TouchableOpacity>
          <Text style={postDetailsFooterStyles.likesCount}>
            {likesCount > 999
              ? `${(likesCount / 1000).toFixed(1)}k`
              : likesCount}
          </Text>
        </View>
      </View>
    </View>
  );
};

const postDetailsFooterStyles = StyleSheet.create({
  container: {
    marginHorizontal: values.spacing.md,
    marginTop: values.spacing.md,
  },
  location: {
    fontSize: typography.size.sm,
    color: colors.gray,
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: values.spacing.md,
  },
  authorContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_DIAMETER,
    height: AVATAR_DIAMETER,
    borderRadius: AVATAR_DIAMETER / 2,
  },
  authorName: {
    flexGrow: 1,
    fontSize: typography.size.md,
    marginLeft: values.spacing.sm * 1.5,
    color: colors.black,
    maxWidth: 270,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: values.spacing.md,
  },
  likesCount: {
    alignSelf: 'flex-end',
    position: 'absolute',
    right: 0,
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.gray700,
    // backgroundColor: colors.white,
  },
});

const PostDetailComments = ({ postDetails, ...props }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [comments, setComments] = React.useState([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [commentInput, setCommentInput] = React.useState('');
  const [isProcessingComment, setIsProcessingComment] = React.useState(false);

  React.useEffect(() => {
    // Ignore warning that FlatList is nested in ScrollView for now
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

    const fetchData = async () => {
      try {
        const comments = await fetchPostComments(postDetails, dispatch);
        setComments(comments);
      } catch (error) {
        setComments([]);
        setError(error);
        console.error(`Failed to fetch comments: ${error}`);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    };

    if (isLoading || isRefreshing) fetchData();
  }, [isRefreshing]);

  const handlePostComment = async () => {
    setIsProcessingComment(true);

    try {
      const postQuery = new Parse.Query(Parse.Object.extend('Post'));
      postQuery.equalTo('objectId', postDetails.id);
      const post = await postQuery.first();

      const PostComment = Parse.Object.extend('PostComment');
      const postComment = new PostComment();

      const response = await postComment.save({ post, message: commentInput });
      console.log({ response });

      setIsRefreshing(true);
      setCommentInput('');
    } catch (error) {
      Alert.alert('Sorry, something went wrong. Please try again later.');
      console.error(`Failed to post comment: ${error}`);
    }

    setIsProcessingComment(false);
  };

  const renderComment = ({ item }) => {
    const { avatar } = item.author;
    const avatarSource = avatar.url ? { uri: avatar.url } : defaultAvatar;

    const handlePressAvatar = () => {
      navigation.push('UserProfileScreen', {
        userProfile: item.author,
        fetchUser: true,
      });
    };

    return (
      <View
        style={{
          maxWidth: '100%',
          flexDirection: 'row',
          paddingVertical: values.spacing.md,
        }}>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={handlePressAvatar}>
          <FastImage
            width={AVATAR_DIAMETER}
            height={AVATAR_DIAMETER}
            style={[
              postDetailsFooterStyles.avatar,
              { marginRight: values.spacing.md },
            ]}
            source={avatarSource}
          />
        </TouchableOpacity>
        <View
          style={[
            postDetailContentStyles.dialogBox,
            {
              flexGrow: 1,
              flexShrink: 1,
              padding: values.spacing.sm * 1.5,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: values.radius.md,
              marginHorizontal: 0,
            },
          ]}>
          <Text
            style={[
              postDetailContentStyles.dialogBoxText,
              {
                fontSize: typography.size.sm,
                fontWeight: '500',
              },
            ]}>
            {item.comment}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[postDetailCommentsStyles.container, props.style]}>
      {isLoading ? (
        <LoadingTabView
          message="Loading comments..."
          style={postDetailCommentsStyles.tabViewContainer}
        />
      ) : error ? (
        <ErrorTabView
          error={error}
          style={postDetailCommentsStyles.tabViewContainer}
        />
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          ListEmptyComponent={
            <EmptyTabView
              message="No comments. Be the first one!"
              style={postDetailCommentsStyles.tabViewContainer}
            />
          }
        />
      )}
      <View style={postDetailCommentsStyles.textInputContainer}>
        <TextInput
          multiline
          maxLength={200}
          value={commentInput}
          style={postDetailCommentsStyles.commentTextInput}
          placeholder="Add a comment..."
          onChangeText={setCommentInput}
        />
        <Button
          style={postDetailCommentsStyles.postButton}
          primary
          size="small"
          title="Post"
          onPress={handlePostComment}
          disabled={commentInput.trim().length === 0}
          isLoading={isProcessingComment}
        />
      </View>
    </View>
  );
};

const postDetailCommentsStyles = StyleSheet.create({
  container: {
    marginHorizontal: values.spacing.md,
    marginTop: values.spacing.md,
  },
  tabViewContainer: {
    paddingTop: values.spacing.lg,
    paddingBottom: values.spacing.lg,
  },
  textInputContainer: {
    flexDirection: 'row',
    marginVertical: values.spacing.md,
    alignItems: 'flex-end',
  },
  commentTextInput: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: TEXT_INPUT_HEIGHT,
    borderColor: colors.gray700,
    borderWidth: values.border.thin,
    borderRadius: values.radius.md,
    padding: values.spacing.md,
  },
  postButton: {
    height: TEXT_INPUT_HEIGHT,
    width: 50,
    marginLeft: values.spacing.md,
  },
});

const PostDetailScreen = (props) => {
  const {
    route: { params: givenPostDetails },
  } = props;

  const [postDetails, setPostDetails] = React.useState(givenPostDetails);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // TODO: Work on this
  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const newPostDetails = await fetchPostDetails(postDetails.id);
        setPostDetails({ ...givenPostDetails, ...newPostDetails });
      } catch (error) {
        console.error(`Failed to refresh metrics: ${error}`);
      }

      setIsRefreshing(false);
    };

    if (isRefreshing) fetchMetrics();
  }, [isRefreshing]);

  const handleRefresh = () => {
    if (!isRefreshing) setIsRefreshing(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'position' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : -100}
      style={{ height: '100%', backgroundColor: colors.white }}>
      <SafeAreaView style={{ paddingBottom: values.spacing.lg }}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.gray500]}
              tintColor={colors.gray500}
            />
          }>
          <PostDetailContent
            postDetails={postDetails}
            style={{ marginTop: values.spacing.md }}
          />
          <PostDetailFooter postDetails={postDetails} />
          <PostDetailComments postDetails={postDetails} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const mapStateToProps = (state) => {
  const {
    cachedState: { comments } = {},
    userState: { userDetails = {} } = {},
  } = state;

  return {
    comments,
    userDetails,
  };
};

export default connect(mapStateToProps)(PostDetailScreen);
