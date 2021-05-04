import React, { useEffect, useState } from 'react';
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
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';

import { Button, PostItem } from './components';
import { colors, values, typography } from './constants';

const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const POST_DETAIL_ICON_SIZE = 32;
const AVATAR_DIAMETER = POST_DETAIL_ICON_SIZE;

const PostDetails = ({ postDetails }) => {
  const navigation = useNavigation();
  const { caption, author, metrics, location } = postDetails;

  const handlePressAvatar = () => {
    navigation.navigate('UserProfileScreen', {
      userProfile: author,
      metrics: metrics,
    });
  };

  // const renderItem = ({ item }) => {
  //   return (
  //     <Image
  //       width={100}
  //       height={100}
  //       resizeMode="cover"
  //       source={{ uri: item.url }}
  //     />
  //   );
  // };

  const likesCount =
    metrics.likesCount > 999
      ? `${(metrics.likesCount / 1000).toFixed(1)}k`
      : `${metrics.likesCount}`;

  return (
    <ScrollView>
      <View style={{ alignItems: 'center', marginBottom: values.spacing.md }}>
        <Image
          source={postDetails.source}
          style={{
            borderRadius: values.radius.md,
            width: postDetails.dimensions.width * 0.55,
            height: postDetails.dimensions.height * 0.55,
          }}
        />
      </View>
      <Text style={postDetailsStyles.caption}>{caption}</Text>
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
              {author.name}
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
    </ScrollView>
  );
};

const postDetailsStyles = StyleSheet.create({
  caption: {
    fontSize: typography.size.md,
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
    marginLeft: values.spacing.sm,
  },
  likesCount: {
    alignSelf: 'flex-end',
    position: 'absolute',
    right: 0,
    fontSize: typography.size.sm,
    fontWeight: '500',
    color: colors.darkGray,
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
