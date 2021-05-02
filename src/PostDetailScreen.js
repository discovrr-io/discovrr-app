import React, { useEffect, useState } from 'react';
import {
  useWindowDimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { connect } from 'react-redux';

import { Button, PostItemKind } from './components';
import { values, typography } from './constants';

// const PostDetails = ({}) => {
//   return (
//     <ScrollView style={{ backgroundColor: 'gold' }}>
//       <Text>POST DETAILS</Text>
//     </ScrollView>
//   );
// };

// const CommentContainer = ({}) => {
//   return (
//     <KeyboardAvoidingView
//       behavior="position"
//       // style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
//     >
//       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//         <View style={{ flexDirection: 'row', alignContent: 'stretch' }}>
//           <TextInput placeholder="Add your comment..." />
//           <Button primary size="small" title="Post" />
//         </View>
//       </TouchableWithoutFeedback>
//     </KeyboardAvoidingView>
//   );
// };

const PostDetailScreen = (props) => {
  const {
    route: { params: postDetails },
  } = props;

  // if (postDetails.hasMedia) {
  //   postDetails.postType = postDetails.isVideo
  //     ? PostItemKind.VIDEO
  //     : PostItemKind.IMAGE;
  // } else {
  //   postDetails.postType = PostItemKind.TEXT;
  // }

  if (!postDetails.__refactored) {
    if (postDetails.hasMedia) {
      postDetails.postType = postDetails.isVideo
        ? PostItemKind.VIDEO
        : PostItemKind.IMAGE;
    } else {
      postDetails.postType = PostItemKind.TEXT;
    }

    postDetails.caption = postDetails.title;
    postDetails.author = {
      name: postDetails.name,
      avatar: postDetails.avatarObject ?? { url: postDetails.avatar },
    };

    postDetails.dimensions = {
      width: postDetails.width,
      height: postDetails.height,
    };

    postDetails.hasMedia = undefined;
    postDetails.isVideo = undefined;
    postDetails.user = undefined;
    postDetails.title = undefined;
    postDetails.width = undefined;
    postDetails.height = undefined;
  }

  return (
    <SafeAreaView
      style={{
        marginTop: values.spacing.md,
        marginHorizontal: values.spacing.md,
      }}>
      <ScrollView>
        <Text style={{ fontSize: typography.size.sm }}>
          {JSON.stringify(postDetails.author)}
        </Text>
        {/* <Image source={postDetails.author.avatar} /> */}
      </ScrollView>
    </SafeAreaView>
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
