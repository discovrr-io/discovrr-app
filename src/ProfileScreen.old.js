import React, { Component, useState } from 'react';

import {
  Animated,
  NativeEventEmitter,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { connect } from 'react-redux';

import { HeaderHeightContext } from '@react-navigation/stack';

import { Avatar, Surface } from 'react-native-paper';

import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import MasonryList from 'react-native-masonry-list';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import StickyParallaxHeader from 'react-native-sticky-parallax-header';

import { withSafeAreaInsets } from 'react-native-safe-area-context';

import {
  constants,
  colors,
  sizes,
  screenStyles,
} from './parallaxEnjaga/constants';

import { isAndroid, windowHeight, windowWidth } from './utilities/Constants';

import {
  updateNotes,
  updateUserPosts,
  updateLikedPosts,
} from './utilities/Actions';

const Parse = require('parse/react-native');

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const { event, ValueXY } = Animated;

const isDevMode = process.env.NODE_ENV === 'development';

const maxHeaderWidth = windowWidth * 0.465;
const maxFooterWidth = windowWidth * 0.475;

class ProfileScreen extends Component {
  constructor(props) {
    super(props);

    this.snackbarEmitter = new NativeEventEmitter('showSnackbar');
    this.bottomSheetEmitter = new NativeEventEmitter('pinPostToNote');

    ({
      dispatch: this.dispatch,
      navigation: {
        addListener: this.addListener,
        removeListener: this.removeListener,
        navigate: this.navigate,
        pop: this.pop,
        goBack: this.goBack,
      },
      route: {
        params: {
          isUserProfile: this.isUserProfile,
          isVendor: this.isVendor,
          userProfile: this.userProfile,
          refreshAction: this.refreshAction,
        } = {},
      },
    } = props);

    debugAppLogger({
      info: 'ProfileScreen constructor',
      insets: props.insets,
      route: props.route,
      userProfile: this.userProfile,
      userDetails: props.userDetails,
    });

    this.isOwner =
      !this.isUserProfile ||
      (this.userProfile?.profileId &&
        this.userProfile.profileId === props?.userDetails?.profileId);

    this.state = {
      sceneFocused: true,
      showStatusBar: true,
      headerLayout: {
        height: 0,
      },
      contentHeight: {},
      modalVisible: false,
      refreshing: false,
      topReached: true,
      endReached: false,
      stickyHeaderEndReached: false,
      stickyHeaderTopReached: true,
    };
    this.scrollY = new ValueXY();
  }

  componentDidMount() {
    // this.addListener('focus', () => this.sceneFocused());
    // this.addListener('blur', () => this.sceneBlurred());

    this.unsubscribe = this.addListener('tabPress', (e) => {
      e.preventDefault();
      // alert('prevented enjaga');
      // do something
    });

    this.fetchData('posts');
    this.fetchData('likedPosts');
    this.fetchData('notes');
  }

  componentWillUnmount() {
    //
  }

  sceneFocused = () => {
    const { showStatusBar } = this.state;

    if (!showStatusBar) this.setState({ showStatusBar: true });
  };

  sceneBlurred = () => {
    const { showStatusBar } = this.state;

    if (showStatusBar) this.setState({ showStatusBar: false });
  };

  showMessage = (snackbarMessage) => () => {
    if (snackbarMessage) {
      this.snackbarEmitter.emit('showSnackbar', {
        message: snackbarMessage,
      });
    }
  };

  fetchData = async (selector) => {
    let query;

    try {
      Parse.User.currentAsync()
        .then(async (currentUser) => {
          if (currentUser) {
            const { userDetails } = this.props;

            debugAppLogger({
              info: 'fetchData - ProfileScreen',
              // currentUser,
              userDetails,
              isUserProfile: this.isUserProfile,
            });

            if (selector === 'posts' || selector === 'likedPosts') {
              const isLikedPost = selector === 'likedPosts';
              const profileId = this.isUserProfile
                ? this.userProfile.profileId
                : userDetails.profileId;

              if (selector === 'posts') {
                const profilePointer = {
                  __type: 'Pointer',
                  className: 'Profile',
                  objectId: profileId,
                };

                debugAppLogger({
                  info: 'profilePointer - ProfileScreen',
                  isUserProfile: this.isUserProfile,
                  profilePointer,
                });

                query = new Parse.Query(Parse.Object.extend('Post'));
                query.include('profile');
                query.equalTo('profile', profilePointer);

                if (!isDevMode) query.equalTo('status', 0);

                query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));

                query.descending('createdAt');
              } else {
                const Profile = Parse.Object.extend('Profile');
                const profilePointer = new Profile();
                profilePointer.id = profileId;

                const likedPostsRelation = profilePointer.relation(
                  'likedPosts',
                );
                query = likedPostsRelation.query();
                query.equalTo('status', 0);
              }

              const results = await query.find();

              debugAppLogger({
                info: `Donkeys posts - ${selector}`,
                length:
                  (Array.isArray(results) && results.length) || 'Not an array',
                results,
              });

              if (Array.isArray(results) && results.length) {
                const {
                  userId,
                  // profileId,
                } = userDetails;

                const items = results.map((item) => {
                  const hasProfile = !!item.get('profile');

                  let distance;

                  const images = item.get('media');
                  if (Array.isArray(images) && images.length) {
                    images.forEach(({ type }, i) => {
                      if (type === 'video') images[i].isVideo = true;
                    });

                    // if (isDevMode && false) images[0].isVideo = true;
                  }

                  const firstImage =
                    (Array.isArray(images) && images.length && images[0]) ||
                    null;
                  let imageUrl = firstImage?.url ?? null;

                  let source = imageUrl ? { uri: imageUrl } : imagePlaceholder;

                  let poster;

                  let likesCount = 0;
                  let hasLiked = false;
                  const likersArray = item.get('likersArray');
                  if (Array.isArray(likersArray) && likersArray.length) {
                    likesCount = likersArray.length;

                    hasLiked = likersArray.some((liker) => profileId === liker);
                  }

                  const width = windowWidth / 2;
                  const title = item.get('caption');
                  const avatar =
                    item.get('profile')?.get('avatar') ?? undefined;
                  const itemData = {
                    isOwner: !!this.isOwner,
                    isLikedPost,
                    userId,
                    profileId,
                    likesCount,
                    hasLiked,
                    distance,
                    postType: selector,
                    isProfileView: true,
                    isHomeScreen: true,
                    hasMedia: !!imageUrl,
                    // isVideo: !!(firstImage && firstImage.type === 'video'), // isDevMode
                    isVideo: false, // isDevMode
                    poster,
                    avatar,
                    width,
                    images,
                    imageUrl,
                    source,
                    viewCount: item.get('viewersCount'),
                    title: title || 'Food',
                    imageData: firstImage,
                    key: `${imageUrl || imagePlaceholder}${title}`,
                    id: item.id,
                    isPrivate: false,
                    height:
                      width *
                      ((imageUrl ? firstImage.height : 600) /
                        (imageUrl ? firstImage.width : 800)),
                    name: item.get('profile').get('name'),
                    surname: item.get('profile').get('surname'),
                    user: {
                      _id: item.get('profile').id,
                      profileId: item.get('profile').id,
                      name: item.get('profile').get('name'),
                      surname: item.get('profile').get('surname'),
                      avatar: avatar?.url ?? undefined,
                    },
                  };

                  if (!imageUrl) {
                    itemData.height = 1;
                    itemData.width = 1;
                    itemData.dimensions = {
                      height: 1,
                      width: 1,
                    };
                  } else {
                    itemData.dimensions = {
                      height: itemData.height,
                      width: itemData.width,
                    };
                  }

                  itemData.initials = '--';
                  if (!imageUrl) {
                    if (itemData.surname) {
                      itemData.initials = itemData.surname.substring(0, 1);
                    }

                    if (itemData.name) {
                      if (itemData.initials === '--') {
                        itemData.initials = itemData.name.substring(0, 1);
                      } else {
                        itemData.initials = `${
                          itemData.initials
                        }${itemData.name.substring(0, 1)}`;
                      }
                    }
                  }

                  return itemData;
                });

                if (this.isUserProfile) {
                  this.setState({
                    [selector]: Array.isArray(items) ? items : [],
                  });
                } else if (selector === 'posts') {
                  this.dispatch(
                    updateUserPosts(Array.isArray(items) ? items : []),
                  );
                } else {
                  this.dispatch(
                    updateLikedPosts(Array.isArray(items) ? items : []),
                  );
                }

                debugAppLogger({
                  info: 'ProfileScreen fetchData for donkeys posts',
                  distance: items[0].distance,
                  firstItem: items[0],
                });
              } else if (!this.isUserProfile) {
                if (selector === 'posts') {
                  this.dispatch(updateUserPosts([]));
                } else {
                  this.dispatch(updateLikedPosts([]));
                }
              }
            } else {
              const userPointer = this.isUserProfile
                ? {
                    __type: 'Pointer',
                    className: '_User',
                    objectId: this.userProfile._id,
                  }
                : currentUser;

              debugAppLogger({
                info: 'userPointer',
                userPointer,
                userProfile: this.userProfile,
              });

              query = new Parse.Query(Parse.Object.extend('Board'));
              query.equalTo('owner', userPointer);
              const results = await query.find();

              if (Array.isArray(results) && results.length) {
                const notes = results.map((note) => {
                  const imageData = note.get('image');
                  const imageUrl = imageData?.url ?? null;
                  const source = imageUrl
                    ? { uri: imageUrl }
                    : imagePlaceholder;
                  const width = windowWidth / 2;
                  const title = note.get('title');
                  debugAppLogger({
                    info: 'enjagaTitles',
                    title,
                  });
                  const noteData = {
                    // isHomeScreen: true,
                    width,
                    imageData,
                    imageUrl,
                    source,
                    title,
                    key: `${imageUrl || imagePlaceholder}${title}`,
                    id: note.id,
                    isPrivate: note.get('private'),
                    height:
                      width *
                      ((imageUrl ? imageData.height : 600) /
                        (imageUrl ? imageData.width : 800)),
                  };

                  noteData.dimensions = {
                    height: noteData.height,
                    width: noteData.width,
                  };

                  return noteData;
                });

                debugAppLogger({
                  info: 'injector notes',
                  note: notes[0],
                });

                if (Array.isArray(notes)) {
                  if (this.isUserProfile) {
                    this.setState({
                      notes,
                    });
                  } else {
                    this.dispatch(updateNotes(notes));
                  }
                }

                debugAppLogger({
                  info: 'ProfileScreen fetchData',
                  notes,
                });
              }
            }
          }

          // this.setState({
          //   isRefreshingData: false,
          // });
        })
        .catch((error) => {
          // alert(error.message);
          //
          // this.setState({
          //   isRefreshingData: false,
          // });
        });
    } catch (error) {
      //
    }
  };

  setHeaderSize = (headerLayout) => this.setState({ headerLayout });

  showNoteDetails = (data, data2) => {
    debugAppLogger({
      info: 'showNoteDetails',
      data,
      data2,
    });

    this.showDetails(data)();
  };

  showDetails = (data) => () => {
    debugAppLogger({
      info: 'BoardsScreen showDetails',
      data,
    });

    this.navigate('NoteDetailScreen', data);
  };

  showCommenPostDetails = (dataItem) => () => {
    const data = {
      ...dataItem,
      pinPostToNote: () => this.pinPostToNote(dataItem),
    };

    this.navigate('PostDetailScreen', data);
  };

  handleTap = (dataItem) => {
    const postData = {
      ...dataItem,
      pinPostToNote: () => this.pinPostToNote(dataItem)(),
      refreshData: () => {
        this.goBack();
        this.refreshAction();
      },
    };

    this.navigate('PostDetailScreen', postData);
  };

  pinPostToNote = (post) => () => {
    try {
      debugAppLogger({
        info: 'pinPostToNote',
        post,
      });
      this.bottomSheetEmitter.emit('showPanel', {
        extraData: {
          postData: post,
        },
        contentSelector: 'pinPostToNote',
        onFinish: (data) => {
          debugAppLogger({
            info: 'onFinish pinPostToNote',
            data,
          });
        },
      });
    } catch (e) {
      //
    }
  };

  shouldBeEnabled = () => {
    const {
      endReached,
      stickyHeaderEndReached,
      topReached,
      stickyHeaderTopReached,
    } = this.state;

    const bottomCondition = endReached && stickyHeaderEndReached;
    const topCondition = topReached && stickyHeaderTopReached;

    return bottomCondition || !topCondition;
  };

  onScroll = ({ nativeEvent }) => {
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;

    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
      this.setState({
        endReached: true,
        topReached: false,
      });
    }

    if (contentOffset.y <= 0) {
      this.setState({
        topReached: true,
        endReached: false,
        stickyHeaderTopReached: true,
      });
    }
  };

  stickyHeaderEndReached = () => {
    this.setState({
      stickyHeaderEndReached: true,
      stickyHeaderTopReached: false,
    });
  };

  stickyHeaderTopReached = () => {
    this.setState({
      stickyHeaderTopReached: true,
      stickyHeaderEndReached: false,
    });
  };

  renderHeader = () => (
    <View style={[styles.headerWrapper, { backgroundColor: 'transparent' }]}>
      <Text style={{ color: 'white' }}>Edit Profile</Text>
    </View>
  );

  renderEmptyView = (selector) => () => (
    <View
      style={{
        flex: 1,
        height: windowHeight * 0.9,
        paddingTop: windowHeight * 0.15,
        // justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>{`No ${selector}`}</Text>
    </View>
  );

  renderItemHeader = (item) => {
    if (item.imageUrl) return null;

    return (
      <ItemHeader
        postTypes={this.postTypes}
        item={item}
        showCommenPostDetails={this.showCommenPostDetails(item)}
      />
    );
  };

  renderItemFooter = (item) => {
    if (!item.imageUrl) return null;

    return (
      <ItemFooter
        postTypes={this.postTypes}
        item={item}
        showCommenPostDetails={this.showCommenPostDetails(item)}
      />
    );
  };

  renderPosts = () => {
    const { posts = [] } = this.state;

    const { userPosts } = this.props;

    const items = this.isUserProfile ? posts : userPosts;

    return (
      <View
        style={{
          backgroundColor: 'white',
          minHeight: windowHeight * 0.9,
        }}>
        <MasonryList
          sorted
          rerender
          columns={2}
          initialNumInColsToRender={1}
          containerWidth={windowWidth}
          spacing={1.5}
          images={items}
          backgroundColor="#FFFFFFS"
          // customImageComponent={FastImage}
          imageContainerStyle={{
            borderRadius: 5,
          }}
          onPressImage={this.handleTap}
          renderIndividualHeader={this.renderItemHeader}
          renderIndividualFooter={this.renderItemFooter}
          masonryFlatListColProps={{
            ListEmptyComponent: this.renderEmptyView('posts'),
          }}
        />
      </View>
    );
  };

  renderNoteItem = ({ item }) => (
    <View
      style={{
        maxWidth: windowWidth * 0.47,
      }}>
      <FastImage
        style={[{ width: item.width, height: 300, backgroundColor: '#FBFBFB' }]}
        source={item.source}
        resizeMode={FastImage.resizeMode.cover}
        // onLoad={() => setImageLoaded(true)}
      >
        {!!item.title && (
          <View style={styles.imageOverlayContainer}>
            <Text
              allowFontScaling={false}
              style={[
                styles.noteTitle,
                {
                  color: item.imageUrl ? 'white' : 'black',
                  fontWeight: item.imageUrl ? 'bold' : 'normal',
                },
              ]}>
              {item.title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 7,
                marginBottom: 7,
              }}
            />
          </View>
        )}
      </FastImage>
    </View>
  );

  renderNotes = () => {
    const { notes } = this.state;

    const { notes: userNotes } = this.props;

    const items = this.isUserProfile ? notes : userNotes;

    debugAppLogger({
      info: 'renderNotes - ProfileScreen',
      items,
    });

    return (
      <View
        style={{
          backgroundColor: 'white',
          minHeight: windowHeight * 0.9,
        }}>
        <MasonryList
          sorted
          rerender
          // key={masonryKey}
          columns={2}
          containerWidth={windowWidth}
          spacing={2}
          images={items}
          backgroundColor="#FFF"
          // customImageComponent={FastImage}
          imageContainerStyle={{
            borderRadius: 5,
          }}
          onPressImage={this.showNoteDetails}
          listContainerStyle={{
            paddingBottom: 10,
          }}
          masonryFlatListColProps={{
            ListEmptyComponent: this.renderEmptyView('notes'),
            onScroll: this.onScroll,
          }}
        />
      </View>
    );
  };

  renderLikedPosts = () => {
    const { likedPosts } = this.state;

    const { likedPosts: userLikedPosts } = this.props;

    const items = this.isUserProfile ? likedPosts : userLikedPosts;

    return (
      <View
        style={{
          backgroundColor: 'white',
          minHeight: windowHeight * 0.9,
        }}>
        <MasonryList
          sorted
          rerender
          columns={2}
          initialNumInColsToRender={1}
          containerWidth={windowWidth}
          spacing={1.5}
          images={items}
          backgroundColor="#FFFFFFS"
          // customImageComponent={FastImage}
          imageContainerStyle={{
            borderRadius: 5,
          }}
          onPressImage={this.handleTap}
          renderIndividualHeader={this.renderItemHeader}
          renderIndividualFooter={this.renderItemFooter}
          masonryFlatListColProps={{
            ListEmptyComponent: this.renderEmptyView('liked posts'),
          }}
        />
      </View>
    );
  };

  renderOffers = () => {
    const { offers = [] } = this.state;

    return (
      <View
        style={{
          backgroundColor: 'white',
          minHeight: windowHeight * 0.9,
        }}>
        <MasonryList
          sorted
          rerender
          columns={2}
          initialNumInColsToRender={1}
          containerWidth={windowWidth}
          spacing={1.5}
          images={offers}
          backgroundColor="#FFFFFFS"
          // customImageComponent={FastImage}
          imageContainerStyle={{
            borderRadius: 5,
          }}
          onPressImage={this.handleTap}
          renderIndividualHeader={this.renderItemHeader}
          renderIndividualFooter={this.renderItemFooter}
          masonryFlatListColProps={{
            ListEmptyComponent: this.renderEmptyView('offers'),
          }}
        />
      </View>
    );
  };

  render() {
    const { showStatusBar } = this.state;

    const { insets, userDetails = {} } = this.props;

    const {
      avatar: { url: avatarUrl } = {},
      coverPhoto: { url: coverPhotoUrl } = {},
    } = this.isUserProfile ? this.userProfile : userDetails;

    const backgroundImage = coverPhotoUrl
      ? { uri: coverPhotoUrl }
      : imagePlaceholder;
    const avatarImage = avatarUrl ? { uri: avatarUrl } : defaultAvatar;

    return (
      <HeaderHeightContext.Consumer>
        {(headerHeight) => (
          <>
            <StickyParallaxHeader
              stackHeaderHeight={headerHeight}
              headerType="TabbedHeader"
              userDetails={this.isUserProfile ? this.userProfile : userDetails}
              navigate={this.navigate}
              pop={this.pop}
              showMessage={this.showMessage}
              insets={insets}
              transparentHeader
              // backgroundColor="#FFFFFF"
              avatarImage={avatarImage}
              backgroundImage={backgroundImage}
              foregroundImage={null}
              snapToEdge={false}
              bounces={false}
              header={this.renderHeader}
              deviceWidth={constants.deviceWidth}
              parallaxHeight={sizes.homeScreenParallaxHeader}
              scrollEvent={event(
                [{ nativeEvent: { contentOffset: { y: this.scrollY.y } } }],
                {
                  useNativeDriver: false,
                },
              )}
              headerSize={this.setHeaderSize}
              headerHeight={sizes.headerHeight}
              tabTextContainerStyle={{
                width: windowWidth / (this.isVendor ? 4 : 3),
              }}
              tabTextContainerActiveStyle={{
                borderBottomWidth: 3,
                borderBottomColor: '#00D8C6',
              }}
              // tabsContainerBackgroundColor={colors.primaryGreen}
              tabsWrapperStyle={{ paddingHorizontal: 0 }}
              tabTextStyle={{
                fontSize: 16,
                color: '#777777',
                paddingVertical: 8,
              }}
              tabTextActiveStyle={{
                fontSize: 16,
                color: 'black',
                paddingVertical: 8,
              }}
              tabsContainerStyle={{
                width: windowWidth,
                flexDirection: 'row',
                backgroundColor: 'white',
                paddingHorizontal: 0,
              }}
              title=""
              tabs={
                this.isVendor
                  ? [
                      {
                        title: 'Posts',
                        content: this.renderPosts(),
                      },
                      {
                        title: 'Notes',
                        content: this.renderNotes(),
                      },
                      {
                        title: 'Liked',
                        content: this.renderLikedPosts(),
                      },
                      {
                        title: 'Offers',
                        content: this.renderOffers(),
                      },
                    ]
                  : [
                      {
                        title: 'Posts',
                        content: this.renderPosts(),
                      },
                      {
                        title: 'Notes',
                        content: this.renderNotes(),
                      },
                      {
                        title: 'Liked',
                        content: this.renderLikedPosts(),
                      },
                    ]
              }
              onEndReached={this.stickyHeaderEndReached}
              onTopReached={this.stickyHeaderTopReached}
            />

            {!!this.isUserProfile && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  // flex: 0,
                  // backgroundColor: 'green',
                  position: 'absolute',
                  // alignSelf: 'flex-end',
                  top: insets.top ? insets.top + 10 : 20,
                  left: 15,
                  // marginRight: 10,
                }}
                onPress={() => this.pop()}>
                <Surface
                  style={{
                    // position: 'absolute',
                    // top: '3%',
                    // left: '5%',
                    padding: 4,
                    borderRadius: 15,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  }}>
                  <MaterialCommunityIcon
                    // ref={this.refSelector('coverPhotoRef')}
                    name="close"
                    size={20}
                    color="white"
                  />
                </Surface>
              </TouchableOpacity>
            )}

            {!isAndroid && false && (
              <StatusBar
                barStyle={showStatusBar ? 'light-content' : 'dark-content'}
                // backgroundColor="rgba(0, 0, 0, 0.2)"
                translucent
              />
            )}

            {showStatusBar && false && (
              <StatusBar
                barStyle="light-content"
                backgroundColor="rgba(0, 0, 0, 0.2)"
                translucent
              />
            )}
          </>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

const ItemHeader = ({ postTypes, item, showCommenPostDetails }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const hideBookmarkAction = postTypes === 'nearMePosts';

  return (
    <View
      style={{
        margin: 5,
        marginVertical: 10,
        maxWidth: maxHeaderWidth, // enjagaFlex
        minWidth: maxHeaderWidth, // enjagaFlex
      }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={showCommenPostDetails}
        style={{
          paddingHorizontal: 5,
          paddingTop: 10,
          paddingBottom: item.isOwner ? 5 : 10,
          backgroundColor: '#F1F1F1',
          marginBottom: 4,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#CCCCCC',
          flex: 1,
          // width: maxHeaderWidth, // enjagaFlex
        }}>
        <Text
          allowFontScaling={false}
          numberOfLines={4}
          style={{
            maxWidth: maxHeaderWidth,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#414141',
            // marginLeft: 5,
          }}>
          {item.title}
        </Text>

        {!!item.isOwner && (
          <View
            style={{
              alignSelf: 'flex-end',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 3,
              marginTop: 10,
            }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: 'black',
                marginRight: 5,
              }}>
              {item.viewCount || 0}
            </Text>

            <MaterialIcon name="visibility" size={18} color="black" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const ItemFooter = ({ postTypes, item }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [likedPost, setLikedPost] = useState(!!item.hasLiked);
  const [likeKey, setLikeKey] = useState((item.hasLiked || false).toString());
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);

  const hideBookmarkAction = !item.isLikedPost;
  const hideLikeAction = !item.isLikedPost;
  // const hideDistanceMarker = postTypes !== 'nearMePosts';

  return (
    <View
      style={{
        marginLeft: 5,
        marginTop: 0,
        marginBottom: 10,
        maxWidth: maxFooterWidth, // enjagaFlex
      }}>
      <Text
        allowFontScaling={false}
        numberOfLines={2}
        style={{
          // marginTop: 2,
          marginBottom: 4,
          fontSize: 10,
          fontWeight: 'bold',
          color: '#414141',
        }}>
        {item.title}
      </Text>

      {!!item.isLikedPost && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            flex: 1, // enjagaFlex
            // marginVertical: 2,
            // marginLeft: item.column ? 0 : -5,
            // marginRight: item.column ? -5 : 0,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              // maxWidth: windowWidth * 0.25, // enjagaFlex
              flexBasis: '45%',
              flexGrow: 10,
              flexShrink: 10,
            }}>
            <TouchableOpacity
              activeOpacity={0.8}
              // onPress={showProfileDetails}
            >
              {item.avatar && item.avatar.url ? (
                <FastImage
                  style={{
                    height: 24,
                    width: 24,
                    borderRadius: 15,
                  }}
                  source={{ uri: item.avatar.url }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : postTypes !== 'nearMePosts' ? (
                <Avatar.Text
                  size={32}
                  label={item.initials}
                  style={{
                    backgroundColor: '#777777',
                    color: 'white',
                  }}
                />
              ) : null}
            </TouchableOpacity>

            {(item.column === 0 || true) && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  marginLeft: postTypes !== 'nearMePosts' ? 5 : 0,
                  // maxWidth: windowWidth * 0.15, // enjagaFlex
                  flex: 1,
                }}
                // onPress={showProfileDetails}
              >
                <Text
                  allowFontScaling={false}
                  numberOfLines={2}
                  style={{
                    fontSize: 10,
                    color: '#414141',
                  }}>
                  {item.name || item.surname || '--'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignSelf: 'center',
              justifyContent: 'flex-end',
              flexBasis: '50%', // enjagaFlex
            }}>
            {!hideBookmarkAction && false && (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isProcessing}
                hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 3,
                }}
                // onPress={pinPostToNote}
              >
                <MaterialCommunityIcon
                  name="bookmark-outline"
                  size={18}
                  color="#707070"
                />

                <Text
                  style={{
                    fontSize: 8,
                    alignSelf: 'flex-end',
                    color: '#414141',
                  }}>
                  0
                </Text>
              </TouchableOpacity>
            )}

            {!hideLikeAction && false && (
              <TouchableOpacity
                disabled={isProcessing}
                hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
                style={{
                  flexDirection: 'row',
                  marginHorizontal: 5,
                  paddingHorizontal: 3,
                }}
                // onPress={() => toggleLike()}
              >
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
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ...screenStyles,
  logo: {
    height: 24,
    width: 142,
  },
  tabsWrapper: {
    paddingVertical: 12,
  },
  tabTextContainerStyle: {
    backgroundColor: colors.transparent,
    borderRadius: 18,
  },
  tabTextContainerActiveStyle: {
    backgroundColor: colors.darkMint,
  },
  tabText: {
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.white,
    fontFamily: 'AvertaStd-Semibold',
  },
  modalStyle: {
    margin: 0,
  },
  modalContentContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  homeScreenHeader: {
    backgroundColor: colors.primaryGreen,
  },
});

const mapStateToProps = (state) => {
  const {
    cachedState: { userPosts, notes, likedPosts } = {},
    userState: { userDetails = {} } = {},
  } = state;

  return {
    userDetails,
    notes: notes ?? [],
    likedPosts: likedPosts ?? [],
    userPosts: userPosts ?? [],
  };
};

export default connect(mapStateToProps)(withSafeAreaInsets(ProfileScreen));
