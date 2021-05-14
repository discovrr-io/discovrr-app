import React, { useRef, useState } from 'react';
import {
  useWindowDimensions,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Carousel, { Pagination } from 'react-native-snap-carousel';
// import { SliderBox } from 'react-native-image-slider-box';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';

import { Button, PostItemKind } from './components';
import { colors, values, typography } from './constants';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const POST_DETAIL_ICON_SIZE = 32;
const AVATAR_DIAMETER = POST_DETAIL_ICON_SIZE;

const PostBody = ({ postDetails }) => {
  const { width: screenWidth } = useWindowDimensions();

  const carouselRef = useRef(null);

  const SliderImage = ({ item }) => {
    const width = screenWidth * 0.8;
    const height = item.height * (width / item.height);
    console.log({ width, height });

    const image = { uri: item.url };
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const onImageLoaded = (loadEvent) => {
      if (loadEvent) setIsImageLoaded(true);
    };

    return (
      <Image
        style={{
          width: item.width,
          height: item.height,
          borderRadius: values.radius.md,
        }}
        onLoad={onImageLoaded}
        source={isImageLoaded ? image : imagePlaceholder}
        width={width}
        height={height}
        resizeMode="cover"
      />
    );
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
          case PostItemKind.IMAGE:
            return (
              <Carousel
                ref={(c) => (carouselRef.current = c)}
                data={postDetails.images}
                sliderWidth={screenWidth}
                itemWidth={screenWidth * 0.8}
                renderItem={renderItem}
              />
            );
          case PostItemKind.VIDEO:
            return <Text>VIDEO</Text>;
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
    fontWeight: '600',
  },
});

const PostDetails = ({ postDetails }) => {
  const navigation = useNavigation();
  // const { width: screenWidth } = useWindowDimensions();

  const {
    author,
    location,
    metrics = { likes: 0, isLiked: false, isSaved: false },
    // dimensions = { width: 1, height: 1 },
  } = postDetails;

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
    <View>
      {/* <View style={{ alignItems: 'center', marginBottom: values.spacing.md }}>
        <Carousel
          ref={(c) => (carouselRef.current = c)}
          data={postDetails.images}
          sliderWidth={screenWidth}
          itemWidth={screenWidth * 0.8}
          renderItem={renderItem}
        />
      </View> */}
      <PostBody postDetails={postDetails} />
      <Text style={postDetailsStyles.location}>{location.text}</Text>
      <View style={postDetailsStyles.footerContainer}>
        <TouchableOpacity style={{ flexGrow: 1 }} onPress={handlePressAvatar}>
          <View style={postDetailsStyles.authorContainer}>
            <Image
              style={postDetailsStyles.avatar}
              source={author.avatar ?? defaultAvatar}
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
    </View>
  );
};

const postDetailsStyles = StyleSheet.create({
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
    marginLeft: values.spacing.sm,
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
    <View
      style={{
        flexDirection: 'row',
        alignContent: 'stretch',
        marginTop: values.spacing.sm,
      }}>
      <TextInput style={{ flexGrow: 1 }} placeholder="Add your comment..." />
      <Button primary size="small" title="Post" />
    </View>
  );
};

const PostDetailScreen = (props) => {
  const {
    route: { params: postDetails },
  } = props;

  return (
    <ScrollView
      style={{ backgroundColor: colors.white }}
      nestedScrollEnabled={true}>
      <KeyboardAvoidingView behavior="position">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView
            style={{
              marginTop: values.spacing.md,
              marginHorizontal: values.spacing.md,
            }}>
            <PostDetails postDetails={postDetails} />
            <CommentContainer />
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
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
