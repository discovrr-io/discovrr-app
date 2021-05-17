import React from 'react';
import {
  useWindowDimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';

import { connect } from 'react-redux';

import { Button, PostItemKind } from './components';
import { colors, values, typography } from './constants';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const Parse = require('parse/react-native');

const POST_DETAIL_ICON_SIZE = 32;
const AVATAR_DIAMETER = POST_DETAIL_ICON_SIZE;
const TEXT_INPUT_HEIGHT = 35;
const TEXT_INPUT_WIDTH = 50;

async function fetchPostComments(postDetails) {
  const { id: postId } = postDetails;
  const postPointer = {
    __type: 'Pointer',
    className: 'Profile',
    objectId: postId,
  };

  const query = new Parse.Query(Parse.Object.extend('PostComment'));
  query.equalTo('post', postPointer);
  query.include('profile');

  const results = await query.find();
  console.log({ comments: results });
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

const PostDetailFooter = ({ postDetails, ...props }) => {
  const navigation = useNavigation();

  const { author, metrics = { likes: 0, isLiked: false, isSaved: false } } =
    postDetails;

  const handlePressAvatar = () => {
    navigation.navigate('UserProfileScreen', {
      userProfile: author,
      metrics: metrics,
    });
  };

  const likesCount =
    metrics.likesCount > 999
      ? `${(metrics.likesCount / 1000).toFixed(1)}k`
      : `${metrics.likesCount}`;

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
            <Image
              style={postDetailsFooterStyles.avatar}
              source={author?.avatar ?? defaultAvatar}
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
          <MaterialIcon
            style={postDetailsFooterStyles.actionButton}
            name="share"
            color={colors.gray}
            size={POST_DETAIL_ICON_SIZE}
          />
          <MaterialIcon
            style={postDetailsFooterStyles.actionButton}
            name={metrics.hasSaved ? 'bookmark' : 'bookmark-outline'}
            color={metrics.hasSaved ? colors.black : colors.gray}
            size={POST_DETAIL_ICON_SIZE}
          />
          <MaterialIcon
            style={[
              postDetailsFooterStyles.actionButton,
              { marginRight: values.spacing.md },
            ]}
            name={metrics.hasLiked ? 'favorite' : 'favorite-border'}
            color={metrics.hasLiked ? 'red' : colors.gray}
            size={POST_DETAIL_ICON_SIZE}
          />
          <Text style={postDetailsFooterStyles.likesCount}>{likesCount}</Text>
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
    fontWeight: '500',
    color: colors.gray700,
    backgroundColor: '#f2f2f2',
  },
});

const PostDetailComments = ({ postDetails, ...props }) => {
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchPostComments(postDetails);
      } catch (error) {
        console.error(`Failed to fetch comments: ${error}`);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={[postDetailCommentsStyles.container, props.style]}>
      <View style={postDetailCommentsStyles.textInputContainer}>
        <TextInput
          multiline
          style={postDetailCommentsStyles.commentTextInput}
          placeholder="Add your comment..."
        />
        <Button
          style={postDetailCommentsStyles.postButton}
          primary
          size="small"
          title="Post"
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
  textInputContainer: {
    flexDirection: 'row',
  },
  commentTextInput: {
    flexGrow: 1,
    height: TEXT_INPUT_HEIGHT,
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
    route: { params: postDetails },
  } = props;

  return (
    <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={80}>
      <ScrollView>
        <PostDetailContent
          postDetails={postDetails}
          style={{ marginTop: values.spacing.md }}
        />
        <PostDetailFooter postDetails={postDetails} />
        <PostDetailComments postDetails={postDetails} />
      </ScrollView>
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
