import React, { useState, useRef } from 'react';
import {
  useWindowDimensions,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
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

const POST_DETAIL_ICON_SIZE = 32;
const AVATAR_DIAMETER = POST_DETAIL_ICON_SIZE;

const PostBody = ({ postDetails }) => {
  const { width: screenWidth } = useWindowDimensions();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const carouselRef = useRef(null);

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
          resizeMode={FastImage.resizeMode.contain}
        />
      );
    }
  };

  const renderItem = ({ item }) => <SliderImage item={item} />;

  return (
    <View>
      {(() => {
        switch (postDetails.postType) {
          case PostItemKind.TEXT:
            return (
              <View style={postBodyStyles.dialogBox}>
                <Text style={postBodyStyles.dialogBoxText}>
                  {postDetails.caption}
                </Text>
              </View>
            );
          case PostItemKind.VIDEO /* FALLTHROUGH */:
            console.warn(
              '`PostItemKind.VIDEO` has been deprecated.',
              'Defaulting to `PostItemKind.MEDIA`...',
            );
          case PostItemKind.MEDIA:
            return (
              <>
                <Carousel
                  ref={(c) => (carouselRef.current = c)}
                  data={postDetails.media}
                  sliderWidth={screenWidth}
                  itemWidth={screenWidth * 0.8}
                  renderItem={renderItem}
                  onSnapToItem={(index) => setActiveMediaIndex(index)}
                />
                <Pagination
                  dotsLength={postDetails.media.length}
                  activeDotIndex={activeMediaIndex}
                  dotStyle={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginHorizontal: values.spacing.sm,
                    backgroundColor: colors.gray700,
                  }}
                  inactiveDotStyle={{
                    backgroundColor: colors.gray300,
                  }}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
              </>
            );
          default:
            return null;
        }
      })()}
      {postDetails.postType !== PostItemKind.TEXT && (
        <Text style={postBodyStyles.caption}>{postDetails.caption ?? ''}</Text>
      )}
    </View>
  );
};

const postBodyStyles = StyleSheet.create({
  caption: {
    marginTop: values.spacing.md,
    fontSize: typography.size.md,
  },
  dialogBox: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray,
    borderTopLeftRadius: values.radius.md,
    borderTopRightRadius: values.radius.md,
    borderBottomRightRadius: values.radius.md,
    borderWidth: values.border.thin,
    padding: values.spacing.md * 1.5,
    marginBottom: values.spacing.sm,
  },
  dialogBoxText: {
    color: colors.black,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});

const PostDetails = ({ postDetails }) => {
  const navigation = useNavigation();
  // const { width: screenWidth } = useWindowDimensions();

  const {
    author,
    location = undefined,
    metrics = { likes: 0, isLiked: false, isSaved: false },
    // dimensions = { width: 1, height: 1 },
  } = postDetails;

  const avatarSource = author.avatar
    ? { uri: author.avatar.url }
    : defaultAvatar;

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
    <View style={postDetailsStyles.container}>
      <ScrollView>
        <PostBody postDetails={postDetails} />
        {location && (
          <Text style={postDetailsStyles.location}>{location.text}</Text>
        )}
        <View style={postDetailsStyles.footerContainer}>
          <TouchableOpacity style={{ flexGrow: 1 }} onPress={handlePressAvatar}>
            <View style={postDetailsStyles.authorContainer}>
              <FastImage
                style={postDetailsStyles.avatar}
                source={avatarSource}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={postDetailsStyles.authorName}>
                {author.name.length === 0 ? 'Anonymous' : author.name}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={postDetailsStyles.metricsContainer}>
            <MaterialIcon
              style={postDetailsStyles.actionButton}
              name="share"
              color={colors.gray}
              size={POST_DETAIL_ICON_SIZE}
            />
            <MaterialIcon
              style={postDetailsStyles.actionButton}
              name={metrics.hasSaved ? 'bookmark' : 'bookmark-outline'}
              color={metrics.hasSaved ? colors.black : colors.gray}
              size={POST_DETAIL_ICON_SIZE}
            />
            <MaterialIcon
              style={[
                postDetailsStyles.actionButton,
                { marginRight: values.spacing.md },
              ]}
              name={metrics.hasLiked ? 'favorite' : 'favorite-border'}
              color={metrics.hasLiked ? 'red' : colors.gray}
              size={POST_DETAIL_ICON_SIZE}
            />
            <Text style={postDetailsStyles.likesCount}>{likesCount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const postDetailsStyles = StyleSheet.create({
  container: {
    height: '100%',
    padding: values.spacing.md,
  },
  location: {
    fontSize: typography.size.sm,
    color: colors.gray,
    marginTop: values.spacing.md,
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

const CommentContainer = ({}) => {
  return (
    <View style={commentContainerStyles.container}>
      <TextInput
        multiline
        style={commentContainerStyles.commentTextInput}
        placeholder="Add your comment..."
      />
      <Button
        style={commentContainerStyles.postButton}
        primary
        size="small"
        title="Post"
      />
    </View>
  );
};

const TEXT_INPUT_HEIGHT = 36;

const commentContainerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: values.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: values.spacing.md,
    paddingHorizontal: values.spacing.md,
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
    <KeyboardAvoidingView
      behavior="position"
      keyboardVerticalOffset={75}
      style={{ backgroundColor: colors.white }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {/* <> */}
        <PostDetails postDetails={postDetails} />
        {/* <CommentContainer /> */}
        {/* </> */}
      </TouchableWithoutFeedback>
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
