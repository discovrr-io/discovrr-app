import React from 'react';
import {
  useWindowDimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
const TEXT_INPUT_HEIGHT = 35;
const TEXT_INPUT_WIDTH = 50;

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
      {postDetails.location && (
        <Text style={postDetailContentStyles.location}>
          {postDetails.location.text}
        </Text>
      )}
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
  location: {
    color: colors.gray,
    fontSize: typography.size.sm,
    marginTop: values.spacing.md,
    marginHorizontal: values.spacing.md,
  },
});

const PostDetailComments = ({ postDetails, ...props }) => {
  return (
    <View style={[props.style]}>
      {/* <Text>{JSON.stringify(postDetails)}</Text> */}
    </View>
  );
};

const PostDetailScreen = (props) => {
  const {
    route: { params: postDetails },
  } = props;

  return (
    <ScrollView>
      <PostDetailContent
        postDetails={postDetails}
        style={{ marginVertical: values.spacing.md }}
      />
      <PostDetailComments postDetails={postDetails} />
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
