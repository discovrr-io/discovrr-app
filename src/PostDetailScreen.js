import React, { useState, useRef } from 'react';
import {
  useWindowDimensions,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  SafeAreaView,
  Platform,
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

const PostDetailScreen = (props) => {
  const {
    route: { params: postDetails },
  } = props;

  return (
    <View>
      <Text>Post Detail Screen</Text>
    </View>
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
