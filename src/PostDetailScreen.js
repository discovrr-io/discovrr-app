import React, { Component, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  FlatList,
  Keyboard,
  NativeEventEmitter,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';

import { Avatar, Portal } from 'react-native-paper';
import { connect } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import Gallery from 'react-native-image-gallery';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import RNPopoverMenu from 'react-native-popover-menu';
import Video from 'react-native-video';

import { isAndroid, windowHeight, windowWidth } from './utilities/Constants';
import { updateComments, updateBlockedProfiles } from './utilities/Actions';
import FollowButton from './components/FollowButton';
import ModalActivityIndicatorAlt from './components/ModalActivityIndicatorAlt';

const Parse = require('parse/react-native');

const editIcon = <MaterialIcon name="create" color="#000000" size={24} />;
const deleteIcon = <MaterialIcon name="delete" color="#000000" size={24} />;
const reportIcon = <MaterialIcon name="report" color="#000000" size={24} />;
const blockIcon = <MaterialIcon name="block" color="#000000" size={24} />;

const isDevMode = process.env.NODE_ENV === 'development';

class PostDetailScreen extends Component {
  constructor(props) {
    super(props);

    this.bottomSheetEmitter = new NativeEventEmitter('showPanel');
    this.snackbarEmitter = new NativeEventEmitter('showSnackbar');

    ({
      dispatch: this.dispatch,
      navigation: {
        goBack: this.goBack,
        navigate: this.navigate,
        push: this.push,
        addListener: this.addListener,
        removeListener: this.removeListener,
        setOptions: this.setOptions,
      },
      route: { params: this.postDetails },
    } = props);

    let followingStatus = 'notFollowing';
    if (this.postDetails) {
      debugAppLogger({
        info: 'constructor A - PostDetailScreen',
        user: this.postDetails.user,
        userDetails: props.userDetails,
        pinPostToNote: this.postDetails.pinPostToNote,
        hasLiked: this.postDetails.hasLiked,
        likesCount: this.postDetails.likesCount,
        postDetails: this.postDetails,
      });

      if (
        props.userDetails &&
        props.userDetails.profileId === this.postDetails.user.profileId
      ) {
        followingStatus = 'sameSame';
      }

      this.imageWidth = windowWidth - 20;
      this.imageHeight =
        this.imageWidth * (this.postDetails.height / this.postDetails.width);

      if (
        this.postDetails.hasMedia &&
        Array.isArray(this.postDetails.images) &&
        this.postDetails.images.length
      ) {
        this.fullscreenImages = [];
        this.postDetails.images.forEach((media) => {
          if (media.type !== 'video')
            this.fullscreenImages.push({ source: { uri: media.url } });
        });
      }
    }

    debugAppLogger({
      info: 'constructor B - PostDetailScreen',
      image: this.postDetails.images,
      followingStatus,
      props,
    });

    this.state = {
      followingStatus,
      showModalActivityIndicator: false,
      isFetchingData: true,
      showFullscreen: false,
      commentError: false,
      activeSlide: 0,
      likedPost: !!this.postDetails?.hasLiked || false,
      likesCount: this.postDetails?.likesCount || 0,
      animatedHeight: new Animated.Value(0),
    };
  }

  componentDidMount() {
    if (isAndroid) {
      this.subscriptions = [
        Keyboard.addListener('keyboardDidShow', this.keyboardWillShow),
        Keyboard.addListener('keyboardDidHide', this.keyboardWillHide),
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress),
      ];
    } else {
      this.subscriptions = [
        Keyboard.addListener('keyboardWillShow', this.keyboardWillShow),
        Keyboard.addListener('keyboardWillHide', this.keyboardWillHide),
      ];
    }

    DeviceEventEmitter.addListener('postPinned', this.togglePinnedState);

    this.fetchData();
    this.logPostView();
  }

  componentWillUnmount() {
    DeviceEventEmitter.removeListener('postPinned', this.togglePinnedState);

    this.subscriptions.forEach((sub) => sub.remove());
  }

  refSelector = (selector) => (compRef) => {
    this[selector] = compRef;
  };

  keyboardWillShow = (event) => {
    if (isAndroid) {
      this.setState({ animatedHeight: event.endCoordinates.height });
    } else {
      const { animatedHeight } = this.state;
      Animated.timing(animatedHeight, {
        toValue: event.endCoordinates.height - 40,
        duration: 200,
      }).start();
    }
  };

  keyboardWillHide = () => {
    if (isAndroid) {
      if (!this.ignoreKeyboardHiding) this.setState({ animatedHeight: 0 });
    } else {
      const { animatedHeight } = this.state;
      Animated.timing(animatedHeight, {
        toValue: 0,
        delay: 200,
        duration: 200,
      }).start();
    }
  };

  handleBackPress = () => {
    try {
      const { showFullscreen, showModalActivityIndicator } = this.state;

      if (showModalActivityIndicator) return true;

      if (showFullscreen) {
        this.setState({
          showFullscreen: false,
        });

        return true;
      }
    } catch (e) {
      //
    }

    return false;
  };

  showMessage = (snackbarMessage) => () => {
    if (snackbarMessage) {
      this.snackbarEmitter.emit('showSnackbar', {
        message: snackbarMessage,
      });
    }
  };

  logPostView = async () => {
    try {
      debugAppLogger({
        info: 'logPostView - PostDetailScreen',
        postId: this.postDetails.id,
        // postDetails: this.postDetails,
        string: JSON.stringify(this.postDetails),
      });

      const response = await Parse.Cloud.run('registerPostView', {
        postId: this.postDetails.id,
      });
      debugAppLogger({
        info: 'logPostView response - PostDetailScreen',
        response,
      });
    } catch (e) {
      //
    }
  };

  fetchData = async (scrollToBottom = false) => {
    debugAppLogger({ info: '*********** Gonna query comments' });

    try {
      const postPointer = {
        __type: 'Pointer',
        className: 'Post',
        objectId: this.postDetails.id,
      };

      const query = new Parse.Query(Parse.Object.extend('PostComment'));
      query.equalTo('post', postPointer);
      query.include('profile');
      // query.descending('createdAt');

      const results = await query.find();

      debugAppLogger({
        info: 'fetch comments - PostDetailScreen',
        results,
      });

      if (Array.isArray(results) && results.length) {
        this.postDetails.commentsCount = results.length;

        const items = results.map((item) => {
          const avatar = item.get('profile').get('avatar');
          const name = item.get('profile').get('name');
          const surname = item.get('profile').get('surname');

          let initials = '--';
          if (!avatar?.url) {
            if (surname) initials = surname.substring(0, 1);

            if (name) {
              if (initials === '--') {
                initials = name.substring(0, 1);
              } else {
                initials = `${initials}${name.substring(0, 1)}`;
              }
            }
          }
          const itemData = {
            avatar,
            text: item.get('message'),
            key: item.id,
            id: item.id,
            _id: item.id,
            createdAt: item.get('createdAt'),
            user: {
              name,
              surname,
              initials,
              _id: item.get('profile').id,
              avatar: avatar?.url ?? undefined,
              avatarObject: avatar,
              coverPhoto: item.get('profile').get('coverPhoto'),
              description: item.get('profile').get('description'),
              hometown: item.get('profile').get('hometown'),
            },
          };

          return itemData;
        });

        if (Array.isArray(items) && items.length) {
          this.dispatch(updateComments(this.postDetails.id, items));

          if (scrollToBottom) this.scrollView.scrollToEnd({ animated: true });
        }

        debugAppLogger({
          info: 'fetchData transformed resulst - PostDetailScreen',
          items,
          postDetails: this.postDetails.user,
        });
      }

      this.setState({ isFetchingData: false });
    } catch (error) {
      debugAppLogger({ info: 'Main catch', errorMsg: error.message });
      this.setState({ isFetchingData: false });
    }
  };

  showProfileDetails = (data) => () => {
    const avatar = data?.avatarObject ? { ...data.avatarObject } : undefined;
    let coverPhoto = data?.coverPhoto ? { ...data.coverPhoto } : undefined;

    if (!coverPhoto && avatar) coverPhoto = avatar;
    const userProfile = {
      ...data,
      avatar,
      coverPhoto,
      // avatar: data.avatar ? { ...data.avatar } : undefined,
      // coverPhoto: data.coverPhoto ? { ...data.coverPhoto } : undefined,
      isUserProfile: true,
    };

    debugAppLogger({
      info: 'showProfileDetails - PostDetailScreen',
      userProfile,
      data,
    });

    this.push('UserProfileScreen', { userProfile, isUserProfile: true });
  };

  showPostEditOptions = () => {
    Keyboard.dismiss();

    const isOwner = !!this.postDetails.isOwner;

    const {
      title,
      user: { name },
    } = this.postDetails;

    const menus = isOwner
      ? {
          menus: [
            {
              label: 'Edit post',
              icon: editIcon,
            },
            {
              label: 'Delete post',
              icon: deleteIcon,
            },
          ],
        }
      : {
          menus: [
            {
              label: 'Report post',
              icon: reportIcon,
            },
            {
              label: 'Block user',
              icon: blockIcon,
            },
          ],
        };

    try {
      RNPopoverMenu.Show(this.postEditRef, {
        tintColor: '#FAFAFA',
        textColor: '#000000',
        title: 'Select from',
        menus: [menus],
        onDone: (section, menuIndex) => {
          const selection = isAndroid ? menuIndex : section;
          debugAppLogger({
            info: 'showNoteActionMenu',
            selection,
            section,
            menuIndex,
          });

          if (selection) {
            Alert.alert(
              isOwner ? 'Delete Post?' : 'Block User?',
              `Please confirm ${isOwner ? 'deletion' : 'blocking'} of ${
                isOwner ? title : name
              }`,
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: isOwner ? 'Delete' : 'Block',
                  style: 'ok',
                  onPress: async () => {
                    try {
                      this.setState({
                        showModalActivityIndicator: true,
                      });

                      if (isOwner) {
                        const Post = Parse.Object.extend('Post');
                        const postPointer = new Post();
                        postPointer.id = this.postDetails.id;

                        debugAppLogger({
                          info: 'Delete post - PostDetailScreen',
                          postPointer,
                        });

                        postPointer.set('status', 9);
                        await postPointer.save();
                      } else {
                        const {
                          userDetails: { profileId, blockedProfiles },
                        } = this.props;

                        const Profile = Parse.Object.extend('Profile');
                        const profilePointer = new Profile();
                        profilePointer.id = profileId;

                        profilePointer.addUnique(
                          'blockedProfileArray',
                          this.postDetails.user.profileId,
                        );

                        debugAppLogger({
                          info: 'block user - PostDetailScreen',
                          user: this.postDetails.user.profileId,
                          isOwner,
                          // postPointer,
                        });

                        await profilePointer.save();

                        let tempBlockedProfiles;
                        if (
                          Array.isArray(blockedProfiles) &&
                          blockedProfiles.length
                        ) {
                          tempBlockedProfiles = [
                            ...blockedProfiles,
                            this.postDetails.user.profileId,
                          ];
                        } else {
                          tempBlockedProfiles = [
                            this.postDetails.user.profileId,
                          ];
                        }

                        this.dispatch(
                          updateBlockedProfiles(tempBlockedProfiles),
                        );
                      }

                      const message = isOwner
                        ? 'Successfully deleted post'
                        : `Successfully blocked ${name}`;

                      this.showMessage(message)();

                      this.postDetails.refreshData();

                      this.goBack();
                    } catch (e) {
                      // alert(e.message);
                      //
                    }
                  },
                },
              ],
              {
                cancelable: true,
              },
            );
          } else if (this.postDetails.isOwner) {
            this.bottomSheetEmitter.emit('showPanel', {
              extraData: { ...this.postDetails },
              contentSelector: 'editPost',
              onFinish: ({ title: newTitle, images }) => {
                debugAppLogger({
                  info: 'editPost - inside onFinish -> PostDetailScreen',
                  title,
                  images,
                });

                this.postDetails.title = newTitle;
                this.postDetails.images = images;
                this.postDetails.hasMedia = !!(
                  Array.isArray(images) && images.length
                );

                this.setOptions({
                  title: newTitle,
                });

                this.setState({
                  isProcessing: false,
                });
              },
            });
          } else {
            this.bottomSheetEmitter.emit('showPanel', {
              extraData: { ...this.postDetails },
              contentSelector: 'reportPost',
              onFinish: (data) => {
                debugAppLogger({
                  info: 'inside onFinish',
                  data,
                });
              },
            });
          }
        },
        onCancel: () => {},
      });
    } catch (e) {
      //
    }
  };

  updateInputValue = (input) => (value = '') => {
    debugAppLogger({
      info: 'ProfileEditScreen updateInputValue',
      input,
      value,
    });

    const { [`${input}Error`]: errorValue } = this.state;

    this[input] = value.trim();

    if (errorValue) {
      this.setState({
        [`${input}Error`]: false,
      });
    }
  };

  toggleActivityIndicator = () => {
    this.setState(({ isProcessing }) => ({
      isProcessing: !isProcessing,
    }));
  };

  showShareSheet = () => {
    try {
      this.bottomSheetEmitter.emit('showPanel', {
        extraData: { ...this.postDetails },
        contentSelector: 'shareSheet',
        onFinish: (data) => {
          debugAppLogger({
            info: 'inside onFinish',
            data,
          });
        },
      });
    } catch (e) {
      //
    }
  };

  postComment = async () => {
    // postEnjaga
    try {
      let isBagus = true;

      if (!this.comment || !this.comment.trim()) {
        isBagus = false;
        this.flashErrorIndicator('commentError');
        return;
      }

      debugAppLogger({
        info: 'postComment - PostDetailScreen',
        isBagus,
      });

      if (isBagus) {
        Keyboard.dismiss();
        this.toggleActivityIndicator();

        const postToLikeQuery = new Parse.Query(Parse.Object.extend('Post'));
        postToLikeQuery.equalTo('objectId', this.postDetails.id);
        const post = await postToLikeQuery.first();

        const PostComment = Parse.Object.extend('PostComment');
        const postComment = new PostComment();

        const response = await postComment.save({
          post,
          message: this.comment,
        });

        debugAppLogger({
          info: 'postComment - PostDetailScreen',
          response,
        });

        this.toggleActivityIndicator();

        this.comment = '';
        this.commentInput.clear();

        this.fetchData(true);
      }
    } catch (error) {
      debugAppLogger({
        info: 'createPost firebase storage',
        errorMsg: error.message,
        error,
      });

      this.setState({ isProcessing: false });
    }
  };

  showFullscreen = (imageUrl) => () => {
    try {
      this.fullscreenPage = this.fullscreenImages.findIndex(
        ({ source: { uri } }) => imageUrl === uri,
      );

      if (this.fullscreenPage !== -1) this.setState({ showFullscreen: true });
    } catch (e) {
      //
    }
  };

  closeFullscreenImageViewer = () => {
    this.setState({
      showFullscreen: false,
    });
  };

  renderItem = ({ item }) => {
    return (
      <SliderImage
        imageWidth={this.imageWidth}
        imageHeight={this.imageHeight}
        poster={item.poster}
        uri={item.url}
        isVideo={item.isVideo}
        showFullscreen={this.showFullscreen}
      />
    );
  };

  commentKeyExtractor = (item) => item.id;

  commentSeparator = () => (
    <View
      style={{
        height: 15,
      }}
    />
  );

  renderNoComments = () => (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
      }}>
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 12,
          color: '#888888',
        }}>
        This post has no comments
      </Text>
    </View>
  );

  renderComment = ({ item }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // maxWidth: windowWidth * 0.85,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F1F1F1',
          borderTopRightRadius: 20,
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          paddingVertical: 10,
          paddingHorizontal: 10,
          width: windowWidth * 0.8,
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#666666',
          }}>
          {item.text}
        </Text>
      </View>

      <TouchableOpacity
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          // marginLeft: 10,
          width: windowWidth * 0.14,
        }}
        activeOpacity={0.8}
        disabled
        onPress={this.showProfileDetails(item.user)}>
        {item.user.avatar && item.user.avatar ? (
          <FastImage
            style={{
              height: 32,
              width: 32,
              borderRadius: 25,
            }}
            source={{ uri: item.user.avatar }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Avatar.Text
            size={32}
            label={item.user.initials}
            style={{
              backgroundColor: '#777777',
              color: 'white',
            }}
          />
        )}

        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{
            fontSize: 10,
            color: '#414141',
          }}>
          {item.user.name || item.user.surname || '--'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // renderCustomImage = (image, imageDimensions) => {
  //   if (imageDimensions) {
  //     return (
  //       <FastImage
  //         style={{
  //           height: imageDimensions.height,
  //           width: imageDimensions.width,
  //         }}
  //         source={image.source}
  //         resizeMode={FastImage.resizeMode.cover}
  //       />
  //     );
  //   }
  //
  //   return null;
  // }

  renderCustomImage = (props) => <FastImage {...props} />;

  getComments = () => {
    let postComments = [];
    try {
      const { comments } = this.props;

      if (Array.isArray(comments[this.postDetails.id]))
        postComments = comments[this.postDetails.id];
    } catch (e) {
      //
    }

    return postComments;
  };

  toggleLike = async () => {
    debugAppLogger({
      info: 'Gonna sync like/unlike',
      itemId: this.postDetails.id,
    });

    try {
      const { likedPost, likesCount } = this.state;

      const newLikeState = !likedPost;
      const newLikesCount = likesCount + (newLikeState ? 1 : -1);

      this.setState({
        likedPost: newLikeState,
        likeKey: newLikeState.toString(),
        likesCount: newLikesCount,
      });

      this.postDetails.hasLiked = newLikeState;
      this.postDetails.likesCount = newLikesCount;

      // const postToLikeQuery = new Parse.Query(Parse.Object.extend('Post'));
      // postToLikeQuery.equalTo('objectId', item.id);
      // const post = await postToLikeQuery.first();
      //
      // debugAppLogger({
      //   post,
      // });

      const response = await Parse.Cloud.run('likeOrUnlikePost', {
        postId: this.postDetails.id,
        like: newLikeState,
      });

      debugAppLogger({
        info: 'toggleLike ItemFooter - HomeScreen',
        response,
        newLikeState,
      });
    } catch (error) {
      debugAppLogger({
        info: 'toggleLike error - HomeScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  pinPostToNote = () => {
    try {
      this.postDetails.pinPostToNote();
    } catch (error) {
      debugAppLogger({
        info: 'pinPostToNote - PostDetailScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  togglePinnedState = ({ hasPinned, id }) => {
    try {
      debugAppLogger({
        info: 'togglePinnedState - PostDetailScreen',
        hasPinned,
        id,
      });

      if (this.postDetails.id === id) {
        this.setState({ hasPinned });
      }
    } catch (e) {
      //
    }
  };

  flashErrorIndicator = (errorType) => {
    try {
      const { [errorType]: errorValue } = this.state;

      if (errorValue) {
        this[errorType].flash(1000).then(() => {});
      } else {
        this.setState({ [errorType]: true });
      }
    } catch (e) {
      debugAppLogger({
        info: 'flashErrorIndicator PostCreationScreen',
        errorMsg: e.message,
        error: e,
      });
    }
  };

  render() {
    const {
      followingStatus,
      isFetchingData,
      isProcessing,
      showFullscreen,
      activeSlide,
      commentError,
      animatedHeight,
      likeKey,
      likedPost,
      likesCount,
      showModalActivityIndicator,
      hasPinned,
    } = this.state;

    const hasMedia = !!this.postDetails?.hasMedia ?? false;

    const items = this.getComments();

    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            ref={this.refSelector('scrollView')}
            keyboardShouldPersistTaps="handled">
            <View
              style={{
                flex: 1,
                paddingTop: 5,
                paddingBottom: 50,
                justifyContent: 'center',
              }}>
              {hasMedia && (
                <View>
                  <Carousel
                    // useScrollView
                    // ref={(c) => { this._carousel = c; }}
                    data={this.postDetails.images}
                    renderItem={this.renderItem}
                    sliderWidth={windowWidth}
                    itemWidth={this.imageWidth * 0.9}
                    onSnapToItem={(index) =>
                      this.setState({ activeSlide: index })
                    }
                  />

                  <Pagination
                    // tappableDots
                    // carouselRef={this._carousel}
                    dotsLength={
                      Array.isArray(this.postDetails.images)
                        ? this.postDetails.images.length
                        : 0
                    }
                    activeDotIndex={activeSlide}
                    containerStyle={{
                      // marginTop: 0,
                      paddingTop: 10,
                      paddingBottom: 7,
                    }}
                    // dotColor={'rgba(255, 255, 255, 0.92)'}
                    // dotStyle={styles.paginationDot}
                    // inactiveDotColor={colors.black}
                    // inactiveDotOpacity={0.4}
                    // inactiveDotScale={0.6}
                    // carouselRef={this._slider1Ref}
                    // tappableDots={!!this._slider1Ref}
                  />
                </View>
              )}

              <View style={{ marginHorizontal: 10 }}>
                <View
                  style={{
                    flexDirection: !hasMedia ? 'row' : undefined,
                    alignItems: !hasMedia ? 'center' : undefined,
                    backgroundColor: !hasMedia ? '#F1F1F1' : undefined,
                    borderTopRightRadius: !hasMedia ? 20 : undefined,
                    borderTopLeftRadius: !hasMedia ? 20 : undefined,
                    borderBottomRightRadius: !hasMedia ? 20 : undefined,
                    paddingVertical: !hasMedia ? 5 : undefined,
                    paddingHorizontal: !hasMedia ? 10 : undefined,
                    marginTop: !hasMedia ? 5 : undefined,
                    // width: windowWidth * 0.8,
                  }}>
                  <Text
                    allowFontScaling={false}
                    // numberOfLines={4}
                    style={{
                      // maxWidth: vpWidth,
                      fontSize: 14,
                      color: 'black',
                      marginVertical: 10,
                    }}>
                    {this.postDetails.title}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled
                      onPress={this.showProfileDetails(this.postDetails.user)}>
                      {this.postDetails.avatar &&
                      this.postDetails.avatar.url ? (
                        <FastImage
                          style={{
                            height: 32,
                            width: 32,
                            borderRadius: 25,
                            // marginTop: 5,
                          }}
                          source={{ uri: this.postDetails.avatar.url }}
                          resizeMode={FastImage.resizeMode.cover}
                          // onError={() => setFailedLoadingAvatar(true)}
                        />
                      ) : (
                        <Avatar.Text
                          size={32}
                          label={this.postDetails.initials}
                          style={{
                            backgroundColor: '#777777',
                            color: 'white',
                            // marginTop: 5,
                          }}
                        />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled
                      onPress={this.showProfileDetails(this.postDetails.user)}>
                      <Text
                        allowFontScaling={false}
                        numberOfLines={2}
                        style={{
                          fontSize: 10,
                          color: '#414141',
                          marginLeft: 10,
                          maxWidth: windowWidth * 0.15,
                        }}>
                        {this.postDetails.name ||
                          this.postDetails.displayName ||
                          '--'}
                      </Text>
                    </TouchableOpacity>

                    <FollowButton
                      isPostDetail
                      followingStatus={followingStatus}
                      userDetails={this.postDetails.user}
                    />

                    {followingStatus !== 'sameSame' && false && (
                      <TouchableOpacity
                        activeOpacity={0.8} // FastImage
                        style={{
                          // marginTop: 20 + ((insets && insets.top && insets.top + 10) || 0),
                          // marginTop: stackHeaderHeight,
                          marginLeft: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: '#707070',
                          // backgroundColor: followingStatus === 'notFollowing' ? '#00D8C6' : 'rgba(97, 95, 95, 0.48)',
                          // alignSelf: 'flex-end',
                        }}
                        onPress={this.showMessage(
                          'Following pending implementation',
                        )}>
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontSize: 10,
                            fontWeight: 'normal',
                            color: 'black',
                          }}>
                          {followingStatus === 'notFollowing'
                            ? 'Follow'
                            : 'Unfollow'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View
                    style={{
                      justifyContent: 'center',
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        marginBottom: 3,
                        // marginLeft: 5,
                      }}>
                      <TouchableOpacity
                        hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
                        style={{
                          flexDirection: 'row',
                          paddingHorizontal: 3,
                          marginRight: 5,
                        }}
                        onPress={this.showShareSheet}>
                        <MaterialCommunityIcon
                          name="share-variant"
                          size={18}
                          color="#707070"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
                        style={{
                          flexDirection: 'row',
                          paddingHorizontal: 3,
                        }}
                        onPress={this.pinPostToNote}>
                        <MaterialCommunityIcon
                          name={hasPinned ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={hasPinned ? 'black' : '#707070'}
                        />

                        {/* <Text
                          style={{
                            fontSize: 8,
                            alignSelf: 'flex-end',
                            color: '#414141',
                          }}
                        >
                          0
                        </Text> */}
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={1}
                        hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
                        style={{
                          flexDirection: 'row',
                          marginHorizontal: 5,
                          paddingHorizontal: 3,
                        }}
                        onPress={this.toggleLike}>
                        <Animatable.View key={likeKey} animation="bounceIn">
                          <MaterialIcon
                            name={likedPost ? 'favorite' : 'favorite-border'}
                            size={18}
                            color={likedPost ? 'red' : '#707070'}
                          />
                        </Animatable.View>

                        <Text
                          style={{
                            fontSize: 8,
                            alignSelf: 'flex-end',
                            color: '#414141',
                          }}>
                          {likesCount}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={{
                          flexDirection: 'row',
                          paddingHorizontal: 3,
                        }}>
                        <MaterialIcon
                          name="chat-bubble-outline"
                          size={18}
                          color="#707070"
                        />

                        <Text
                          style={{
                            fontSize: 8,
                            alignSelf: 'flex-end',
                            color: '#414141',
                          }}>
                          {this.postDetails.commentsCount || 0}
                        </Text>
                      </View>

                      <TouchableOpacity
                        ref={this.refSelector('postEditRef')}
                        activeOpacity={1}
                        hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
                        style={{
                          flexDirection: 'row',
                          marginHorizontal: 5,
                          paddingHorizontal: 3,
                        }}
                        onPress={this.showPostEditOptions}>
                        <MaterialCommunityIcon
                          name="dots-vertical"
                          size={18}
                          color="#707070"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {
                  <FlatList
                    data={items}
                    keyExtractor={this.itemKeyExtractor}
                    ItemSeparatorComponent={this.commentSeparator}
                    ListEmptyComponent={this.renderNoComments}
                    renderItem={this.renderComment}
                    contentContainerStyle={{
                      paddingTop: 10,
                      paddingBottom: isFetchingData ? 0 : 0,
                    }}
                  />
                }

                {isFetchingData && (
                  <ActivityIndicator
                    animating
                    color="black"
                    size="small"
                    style={{
                      // marginTop: 10,
                      marginLeft: 4,
                      paddingVertical: 2,
                    }}
                  />
                )}

                <View
                  style={{
                    marginTop: 20,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                    }}>
                    <View
                      style={{
                        flex: 5,
                        borderWidth: 1,
                        borderRadius: 20,
                        borderColor: '#707070',
                      }}>
                      <TextInput
                        ref={this.refSelector('commentInput')}
                        editable={!isProcessing}
                        multiline
                        placeholder="comment..."
                        selectionColor="black"
                        style={{
                          paddingLeft: 10,
                          paddingRight: 5,
                          paddingVertical: 5,
                        }}
                        onChangeText={this.updateInputValue('comment')}
                      />

                      {commentError && (
                        <Animatable.View
                          animation="flash"
                          ref={this.refSelector('commentError')}
                          style={styles.errorCircle}
                        />
                      )}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      disabled={isProcessing}
                      onPress={this.postComment} // postEnjaga
                      style={{
                        // flex: 1,
                        borderRadius: 20,
                        paddingVertical: isProcessing ? 5 : 7,
                        paddingHorizontal: isProcessing ? 18 : 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: 10,
                        alignSelf: 'center',
                        backgroundColor: '#00D8C6',
                      }}>
                      {isProcessing ? (
                        <ActivityIndicator
                          animating
                          color="white"
                          size="small"
                          style={{
                            // transform: [{ scale: 0.8 }],
                            paddingTop: 1,
                            paddingLeft: 1,
                          }}
                        />
                      ) : (
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontSize: 14,
                            // fontWeight: '500',
                            color: 'white',
                          }}>
                          Post
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <Animated.View style={{ height: animatedHeight }} />
          </ScrollView>

          {showFullscreen && (
            <Portal>
              <Gallery
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'black',
                }}
                initialPage={this.fullscreenPage}
                images={this.fullscreenImages}
                imageComponent={this.renderCustomImage}
              />

              <TouchableOpacity
                activeOpacity={0.6}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                onPress={this.closeFullscreenImageViewer}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 20,
                  justifyContent: 'center',
                  position: 'absolute',
                  top: windowHeight * 0.1,
                  left: 20,
                }}>
                <MaterialIcon name="cancel" size={22} color="black" />
              </TouchableOpacity>

              <StatusBar
                animated
                barStyle="light-content"
                backgroundColor="black"
              />
            </Portal>
          )}

          {/* !!(Array.isArray(items) && items.length) && (
            <GiftedChat
              showUserAvatar
              renderUsernameOnMessage
              messages={items}
              user={this.postDetails.user}
              renderChatFooter={() => (
                <View>
                  <Text>
                    Food is good
                  </Text>
                </View>
              )}
              // onSend={messages => onSend(messages)}
            />
          ) */}
        </SafeAreaView>

        {showModalActivityIndicator && (
          <Portal>
            <ModalActivityIndicatorAlt
              // hideIndicator
              opacity={0.1}
              color="gray"
            />
          </Portal>
        )}
      </View>
    );
  }
}

const SliderImage = ({
  imageHeight,
  imageWidth,
  isVideo,
  poster,
  uri,
  showFullscreen,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => (isVideo ? setPaused(!paused) : showFullscreen(uri)())}>
      {isVideo ? (
        <View>
          <Video
            paused
            allowsExternalPlayback={false}
            resizeMode="cover"
            poster={poster}
            source={{ uri }}
            // ref={(ref) => { this.player = ref }}
            // onBuffer={this.onBuffer}                // Callback when remote video is buffering
            // onError={this.videoError}               // Callback when video cannot be loaded
            style={{
              width: imageWidth * 0.9,
              height: imageHeight,
            }}
            onReadyForDisplay={() => setLoaded(true)}
          />

          {!loaded && (
            <ActivityIndicator
              animating
              color="black"
              size="small"
              style={{
                position: 'absolute',
                top: '50%',
                bottom: '50%',
                left: '50%',
                right: '50%',
              }}
            />
          )}
        </View>
      ) : (
        <FastImage
          style={{
            width: imageWidth * 0.9,
            height: imageHeight,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          source={{ uri }}
          resizeMode={FastImage.resizeMode.cover}
          onLoad={() => setLoaded(true)}>
          {!loaded && (
            <ActivityIndicator
              animating
              color="black"
              size="small"
              style={{}}
            />
          )}
        </FastImage>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  avatarImage: {
    // width: Math.min(windowWidth / 2, 300),
    // width: 'auto',
    // maxWidth: windowWidth * 0.7,
    // height: 300,
    // borderRadius: 10,
  },
  divider: {
    marginVertical: 15,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  textInput: {
    fontSize: 18,
    color: 'black',
  },
  actionButton: {
    // flexDirection: 'row',
    // borderWidth: 1,
    // borderColor: '#B7B6B6',
    borderRadius: 25,
    paddingVertical: 7,
    paddingLeft: 30,
    paddingRight: 15,
    // width: Math.min(windowWidth * 0.9, 500),
    // minWidth: 100,
    // borderWidth: 1,
    alignSelf: 'flex-end',
    // maxWidth: 200,
    marginTop: 50,
    backgroundColor: '#00D8C6',
  },
  errorCircle: {
    backgroundColor: '#C62828',
    height: 6,
    width: 6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '40%',
    bottom: '60%',
    right: 7,
  },
});

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
