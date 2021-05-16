import React, { Component, useState } from 'react';

import {
  DeviceEventEmitter,
  FlatList,
  NativeEventEmitter,
  RefreshControl,
  Text,
  // ToastAndroid,
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

import OneSignal from 'react-native-onesignal';
import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import MasonryList from 'react-native-masonry-list';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { connect } from 'react-redux';

import { AppEventsLogger } from 'react-native-fbsdk';

import { Avatar, Snackbar } from 'react-native-paper';

// import {
//   Placeholder,
//   PlaceholderMedia,
//   Fade,
// } from 'rn-placeholder';

// import FollowButton from './components/FollowButton';
import BottomActivityIndicator from './components/BottomActivityIndicator';

import {
  updatePosts,
  updateNearMePosts,
  updateFollowingPosts,
  updatePinnedPosts,
} from './utilities/Actions';

import { windowWidth, windowHeight } from './utilities/Constants';

// const vpWidth = (windowWidth * 0.5) - 15;

const Parse = require('parse/react-native');

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');

const isDevMode = process.env.NODE_ENV === 'development';

const maxHeaderWidth = windowWidth * 0.465;
const maxFooterWidth = windowWidth * 0.475;

class HomeScreen extends Component {
  constructor(props) {
    super(props);

    debugAppLogger({
      info: 'constructor - HomeScreen',
      locationPreference: props.locationPreference,
      // props,
    });

    ({
      dispatch: this.dispatch,
      navigation: { navigate: this.navigate, toggleDrawer: this.toggleDrawer },
      route: { params: { postTypes: this.postTypes = 'posts' } = {} } = {},
    } = props);

    this.bottomSheetEmitter = new NativeEventEmitter('pinPostToNote');
    this.pinnedEmiter = new NativeEventEmitter('postPinned');

    this.pages = {
      // pagination
      next: 0,
      hasMoreData: true,
      size: 40,
    };

    this.donkeyTypes = ['Local', 'Traveller', 'Business'];

    this.state = {
      isRefreshingData: false,
      // isFetchingData: this.postTypes !== 'following',
      isFetchingData: true,
      showSnackbar: false,
      snackbarMessage: '',
    };
  }

  componentDidMount() {
    DeviceEventEmitter.addListener('refreshPosts', this.refreshData);

    this.fetchData();

    if (this.postTypes === 'posts') {
      AppEventsLogger.logEvent('App opened', { user: 'Dev' });

      this.syncOneSignal();
    }
  }

  componentWillUnmount() {
    DeviceEventEmitter.removeListener('refreshPosts', this.refreshData);
  }

  syncOneSignal = async () => {
    OneSignal.getTags((receivedTags) => {
      debugAppLogger({
        info: `OneSignal getTags ${this.postTypes} - HomeScreen`,
        receivedTags,
      });

      if (
        !receivedTags ||
        !Object.prototype.hasOwnProperty.call(receivedTags, 'email')
      ) {
        const { userDetails: { name, email } = {} } = this.props;

        if (email) {
          OneSignal.sendTags({
            name,
            email,
          });
        }
      }
    });
  };

  fetchData = async (origin = null) => {
    debugAppLogger({ info: '*********** Gonna query posts' });
    let geoPoint = 'geoPoint';
    let query;
    const pinnedPosts = {};

    try {
      const {
        userDetails: { userId, profileId, followingArray, blockedProfiles },
      } = this.props;

      const isNearMePosts = this.postTypes === 'nearMePosts';
      let pointOfInterest;
      if (this.postTypes === 'nearMePosts') {
        geoPoint = 'geopoint';
        query = new Parse.Query(Parse.Object.extend('Vendor'));
        query.equalTo('editedDelete', true);
        // query.limit(10);
        // query.include('profile');
        // query.equalTo('status', 0);
        // query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
        const { locationPreference } = this.props;

        debugAppLogger({
          info: 'nearMePosts',
          locationPreference,
        });

        if (locationPreference) {
          pointOfInterest = new Parse.GeoPoint(
            locationPreference.latitude,
            locationPreference.longitude,
          );
          query.withinKilometers(
            geoPoint,
            pointOfInterest,
            locationPreference.searchRadius,
          );
          // query.withinKilometers('geoPoint', pointOfInterest, 20000);
        } else {
          pointOfInterest = new Parse.GeoPoint(
            -33.88013879489698,
            151.1145074106,
          );
          query.withinKilometers(geoPoint, pointOfInterest, 5);
        }
      } else if (this.postTypes === 'followingPosts') {
        debugAppLogger({
          info: 'followingPosts - HomeScreen',
          followingArray,
        });

        if (Array.isArray(followingArray) && followingArray.length) {
          query = new Parse.Query(Parse.Object.extend('Post'));
          query.containedIn('profile', followingArray);

          if (!isDevMode) query.equalTo('status', 0);

          query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
        } else {
          this.setState({
            isFetchingData: false,
          });

          return;
        }
      } else {
        query = new Parse.Query(Parse.Object.extend('Post'));
        query.include('profile');
        query.limit(this.pages.size); // pagination
        query.skip(this.pages.size * this.pages.next);

        if (!isDevMode) query.equalTo('status', 0);

        query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
      }

      if (
        (this.postTypes === 'followingPosts' || this.postTypes === 'posts') &&
        Array.isArray(blockedProfiles) &&
        blockedProfiles.length
      ) {
        query.notContainedIn('profile', blockedProfiles);
      }

      query.descending('createdAt');

      const results = await query.find();

      this.pages.next += 1; // pagination

      debugAppLogger({
        info: `HomeScreen fetchData for ${this.postTypes}`,
        length: Array.isArray(results) ? results.length : 'Not proper results',
        // results,
      });

      if (this.postTypes !== 'nearMePosts') {
        const Profile = Parse.Object.extend('Profile');
        const profilePointer = new Profile();
        profilePointer.id = profileId;

        query = new Parse.Query(Parse.Object.extend('Board'));
        query.equalTo('profile', profilePointer);
        query.equalTo('status', 0);
        query.select('title', 'image', 'pinnedEnjagaArray');
        const response = await query.find();

        if (Array.isArray(response) && response.length) {
          response.forEach((note) => {
            const pinnedEnjagaArray = note.get('pinnedEnjagaArray');

            // if (Array.isArray(pinnedEnjagaArray) && pinnedEnjagaArray.length) {
            //   pinnedPosts = pinnedPosts.concat(pinnedEnjagaArray);
            // }

            if (Array.isArray(pinnedEnjagaArray) && pinnedEnjagaArray.length) {
              pinnedEnjagaArray.forEach((postId) => {
                pinnedPosts[postId] = note.id;
              });
            }
          });
        }
      }

      if (Array.isArray(results) && results.length) {
        debugAppLogger({
          pinnedPosts,
          userId,
          profileId,
        });

        this.pages.hasMoreData = results.length >= this.pages.size;

        const items = results.map((item) => {
          const hasProfile = !!item.get('profile');

          let distance;
          if (this.postTypes === 'nearMePosts') {
            // distance = Math.round(item.get(geoPoint).kilometersTo(pointOfInterest));
            distance = item
              .get(geoPoint)
              .kilometersTo(pointOfInterest)
              .toFixed(1);

            debugAppLogger({
              distance,
            });
          }

          const images = item.get('media');
          if (Array.isArray(images) && images.length) {
            images.forEach(({ type }, i) => {
              if (type === 'video') images[i].isVideo = true;
            });

            if (isDevMode && false) images[0].isVideo = true;
          }

          const firstImage =
            (Array.isArray(images) && images.length && images[0]) || null;
          let imageUrl = firstImage?.url ?? null;

          let source = imageUrl ? { uri: imageUrl } : imagePlaceholder;

          let poster;
          if (isDevMode && false && item.id === 'pdXpEdP36a') {
            firstImage.type = 'video';
            poster = imageUrl;
            imageUrl =
              'https://firebasestorage.googleapis.com/v0/b/discovrr-uat.appspot.com/o/post%2Fenjaga_hphlo635cxt.jpg?alt=media&token=5d7c8146-b636-498e-80e6-8e145f70567a';
            source = {
              uri: 'https://firebasestorage.googleapis.com/v0/b/discovrr-uat.appspot.com/o/post%2Fenjaga_hphlo635cxt.jpg?alt=media&token=5d7c8146-b636-498e-80e6-8e145f70567a',
            };

            images[0].type = 'video';
            images[0].url =
              'https://firebasestorage.googleapis.com/v0/b/discovrr-uat.appspot.com/o/post%2Fenjaga_hphlo635cxt.jpg?alt=media&token=5d7c8146-b636-498e-80e6-8e145f70567a';
          }

          let likesCount = 0;
          let hasLiked = false;
          const likersArray = item.get('likersArray');
          if (Array.isArray(likersArray) && likersArray.length) {
            likesCount = likersArray.length;

            hasLiked = likersArray.some((liker) => profileId === liker);
          }

          const width = windowWidth / 2;
          const title = item.get('caption');
          const avatar = item.get('profile')?.get('avatar') ?? undefined;

          let location;
          let hometown = hasProfile ? item.get('profile').get('hometown') : '';

          if (this.postTypes === 'nearMePosts') {
            location = item.get('location');

            if (location && location.text) {
              hometown = location.text.replace(', Australia', '');
            }
          }

          const isOwner = hasProfile
            ? item.get('profile').id === profileId
            : false;

          const followingArray = hasProfile
            ? item.get('profile').get('followingArray')
            : 0;
          const followingCount = hasProfile
            ? item.get('profile').get('followingCount')
            : 0;
          const followersCount = hasProfile
            ? item.get('profile').get('followersCount')
            : 0;

          const itemData = {
            isOwner,
            userId,
            profileId,
            likesCount,
            hasLiked,
            hasPinned: !!pinnedPosts[item.id],
            pinnedTo: pinnedPosts[item.id],
            distance,
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
            followingCount,
            followersCount,
            location: item.get('location'),
            viewCount: item.get('viewersCount'),
            title:
              this.postTypes === 'nearMePosts'
                ? item.get('about')
                : title || '--',
            imageData: firstImage,
            key: `${imageUrl || imagePlaceholder}${title}`,
            id: item.id,
            isPrivate: false,
            isVendor: this.postTypes === 'nearMePosts',
            height:
              width *
              ((imageUrl ? firstImage.height : 600) /
                (imageUrl ? firstImage.width : 800)),
            name:
              this.postTypes === 'nearMePosts'
                ? item.get('businessName') || '--'
                : hasProfile
                ? item.get('profile').get('name')
                : '',
            surname: hasProfile ? item.get('profile').get('surname') : '',
            user: {
              hometown,
              location,
              followingCount,
              followersCount,
              _id: hasProfile
                ? item.get('profile').get('owner').id
                : Date.now(),
              profileId: hasProfile ? item.get('profile').id : '',
              name:
                this.postTypes === 'nearMePosts'
                  ? item.get('businessName') || '--'
                  : hasProfile
                  ? item.get('profile').get('name')
                  : '',
              surname: hasProfile ? item.get('profile').get('surname') : '',
              avatar: avatar?.url ?? undefined,
              description:
                this.postTypes === 'nearMePosts'
                  ? item.get('about') || '--'
                  : hasProfile
                  ? item.get('profile').get('description')
                  : '',
              avatarObject: hasProfile
                ? item.get('profile')?.get('avatar') ?? undefined
                : {},
              coverPhoto: hasProfile
                ? item.get('profile')?.get('coverPhoto') ?? undefined
                : {},
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

        if (Array.isArray(items)) {
          // const {
          //   item: oldItems = [],
          // } = this.props;
          //
          // const storeItems = oldItems.concat(items);

          switch (this.postTypes) {
            case 'posts':
              this.dispatch(updatePosts(items));
              break;
            case 'nearMePosts':
              this.dispatch(updateNearMePosts(items));
              break;
            case 'followingPosts':
              this.dispatch(updateFollowingPosts(items));
              break;
            default:
            //
          }
        }

        debugAppLogger({
          info: `BoardsScreen fetchData for ${this.postTypes}`,
          distance: items[0].distance,
          // firstItem: items[0],
        });
      } else {
        switch (
          this.postTypes // enjagaNet
        ) {
          case 'posts':
            this.dispatch(updatePosts([]));
            break;
          case 'nearMePosts':
            this.dispatch(updateNearMePosts([]));
            break;
          case 'followingPosts':
            this.dispatch(updateFollowingPosts([]));
            break;
          default:
          //
        }
      }

      debugAppLogger({
        info: `HomeScreen fetchData for ${this.postTypes}`,
        pages: this.pages,
      });

      this.setState({
        isRefreshingData: false,
        isFetchingData: false,
      });
    } catch (error) {
      console.log({
        info: 'Main catch',
        errorMsg: error.message,
        postTypes: this.postTypes,
        error,
      });

      this.setState({
        isRefreshingData: false,
        isFetchingData: false,
      });

      // logException({ error, query });
      // this.setState({ isFetchingData: false, isRefreshingData: false });
    }
  };

  addItems = (data) => {
    // pagination
    // try {
    //   debugAppLogger({
    //     info: `${this.postTypes} donkey wants to add more images`,
    //     data,
    //   });
    //
    //   const {
    //     isFetchingData,
    //     isRefreshingData,
    //   } = this.state;
    //
    //   if (
    //     !isFetchingData
    //     && !isRefreshingData
    //     && this.pages.hasMoreData
    //   ) {
    //     // alert('gonna fetch data');
    //     this.setState({
    //       isFetchingData: true,
    //     }, () => {
    //       this.fetchData('auto');
    //     });
    //   }
    // } catch (e) {
    //   // not cool
    // }
  };

  dismissSnackbar = () => {
    this.setState({
      showSnackbar: false,
      snackbarMessage: '',
    });
  };

  showProfileDetails = (dataItem) => () => {
    let avatar = dataItem.avatar ? { ...dataItem.avatar } : undefined;
    let coverPhoto = dataItem.user.coverPhoto
      ? { ...dataItem.user.coverPhoto }
      : undefined;

    const isVendor = !!dataItem.isVendor;
    if (isVendor && dataItem.imageData) {
      debugAppLogger({
        info: 'showProfileDetails isVendor - HomeScreen',
        dataItem,
      });

      if (!avatar) avatar = { ...dataItem.imageData };

      if (!coverPhoto || !coverPhoto.url)
        coverPhoto = { ...dataItem.imageData };
    }

    if (!coverPhoto && avatar) coverPhoto = avatar;
    const userProfile = {
      ...dataItem.user,
      avatar,
      coverPhoto,
      // avatar: dataItem.avatar ? { ...dataItem.avatar } : undefined,
      // coverPhoto: dataItem.coverPhoto ? { ...dataItem.coverPhoto } : undefined,
      isVendor,
      isUserProfile: true,
    };

    debugAppLogger({
      info: 'showProfileDetails - HomeScreen',
      userProfile,
      dataItem,
    });

    this.navigate('UserProfileScreen', {
      userProfile,
      isVendor,
      isUserProfile: true,
      refreshAction: () => this.refreshData(),
    });
  };

  showMessage = (snackbarMessage) => {
    if (snackbarMessage) {
      // ToastAndroid.show('Notifications Pending implementation', ToastAndroid.SHORT);
      this.setState({
        snackbarMessage,
        showSnackbar: true,
      });
    }
  };

  showLocationFilter = () => {
    try {
      debugAppLogger({
        info: 'Gonna show location filter',
      });

      this.bottomSheetEmitter.emit('showPanel', {
        contentSelector: 'locationFilter',
        onFinish: () => {
          this.refreshData();
        },
      });

      this.closeDrawer();
    } catch (e) {
      //
    }
  };

  pinPostToNote = (post) => (afterAction) => {
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
        onFinish: (data, hasPinned) => {
          debugAppLogger({
            info: 'onFinish pinPostToNote',
            hasPinned,
            data,
          });

          const { userDetails } = this.props;

          const pinnedPosts = userDetails?.pinnedPosts ?? [];

          // const {
          //   followingArray,
          //   dispatch,
          //   afterAction,
          // } = this.props;

          const newPinnedPosts = Array.isArray(pinnedPosts)
            ? [...pinnedPosts]
            : [];

          debugAppLogger({
            info: 'pinPostToNote - HomeScreen',
            pinnedPosts,
            newPinnedPosts,
          });

          if (hasPinned) {
            newPinnedPosts.push(data.id);
            afterAction(hasPinned);
          } else {
            const index = pinnedPosts.findIndex((id) => id === data.id);

            if (index !== -1) pinnedPosts.splice(index, 1);
          }

          // if (typeof afterAction === 'function') afterAction(hasPinned);

          this.dispatch(updatePinnedPosts(newPinnedPosts));

          this.bottomSheetEmitter.emit('postPinned', {
            hasPinned,
            id: data.id,
          });
        },
      });
    } catch (e) {
      //
    }
  };

  toggleLikePost = (post) => () => {
    debugAppLogger({
      info: 'toggleLikePost',
      post,
    });
  };

  postComment = async () => {
    const Post = Parse.Object.extend('Post');
    const post = new Post();
    post.set('caption', 'A pedicure at the mountain top...the best');
    const response = await post.save();
    debugAppLogger({ response });

    // this.response.next(JSON.stringify(response, null, 2));
  };

  showCommenPostDetails = (dataItem) => () => {
    const data = {
      ...dataItem,
      pinPostToNote: () => this.pinPostToNote(dataItem)(),
      refreshData: () => this.refreshData(),
    };

    this.navigate('PostDetailScreen', data);
  };

  handleTapEnjaga = (dataItem) => () => {
    this.handleTap(dataItem);
  };

  handleTap = (dataItem) => {
    if (this.postTypes === 'nearMePosts') {
      debugAppLogger({
        info: 'handleTap',
        user: dataItem.user,
        dataItem,
      });

      this.showProfileDetails(dataItem)();

      return;
    }

    const postData = {
      ...dataItem,
      pinPostToNote: () => this.pinPostToNote(dataItem)(),
      refreshData: () => this.refreshData(),
    };

    this.navigate('PostDetailScreen', postData);

    if (isDevMode && false) {
      const now = Date.now();
      const doublePressDelay = 150;

      if (this.lastTap && now - this.lastTap < doublePressDelay) {
        // alert('Liked');
        clearTimeout(this.doubleTapTimer);
      } else {
        this.lastTap = now;

        this.doubleTapTimer = setTimeout(() => {
          this.lastTap = null;
          // this.showDetails(dataItem)();
          this.navigate('PostDetailScreen', dataItem);
          // console.log(JSON.stringify(dataItem));
        }, doublePressDelay + 1);
      }
    }
  };

  showDetails = (dataItem) => () => {
    const postData = {
      ...dataItem,
      pinPostToNote: () => this.pinPostToNote(dataItem)(),
      refreshData: () => this.refreshData(),
    };

    this.navigate('PostDetailScreen', postData);
  };

  renderItemHeader = (item) => {
    if (item.imageUrl) return null;

    return (
      <ItemHeader
        postTypes={this.postTypes}
        item={item}
        pinPostToNote={this.pinPostToNote(item)}
        showCommenPostDetails={this.showCommenPostDetails(item)}
        showProfileDetails={this.showProfileDetails(item)}
      />
    );
  };

  renderItemFooter = (item) => {
    if (!item.imageUrl) return null;

    return (
      <ItemFooter
        postTypes={this.postTypes}
        item={item}
        pinPostToNote={this.pinPostToNote(item)}
        showCommenPostDetails={this.showCommenPostDetails(item)}
        showProfileDetails={this.showProfileDetails(item)}
        handleTap={this.handleTapEnjaga(item)}
      />
    );
  };

  renderEmptyView = () => {
    // debugAppLogger({
    //   info: 'renderEmptyView - HomeScreen',
    //   postTypes: this.postTypes,
    // });

    let infoMessage = 'No posts';

    if (this.postTypes === 'nearMePosts') {
      infoMessage = 'No posts in your location';
    }

    return (
      <View
        style={{
          flex: 1,
          height: windowHeight * 0.8,
          width: windowWidth,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text
          allowFontScaling={false}
          style={{
            color: '#777777',
          }}>
          {infoMessage}
        </Text>

        {this.postTypes === 'nearMePosts' && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              marginTop: 10,
            }}
            onPress={this.showLocationFilter}>
            <Text
              allowFontScaling={false}
              style={{
                color: '#777777',
                textDecorationLine: 'underline',
              }}>
              Change location & search radius
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  renderFollowingPostsItem = ({ item }) => (
    <FollowingPostsItem
      itemData={item}
      pinPostToNote={this.pinPostToNote(item)}
      showDetails={this.showDetails(item)}
      showCommenPostDetails={this.showCommenPostDetails(item)}
      showProfileDetails={this.showProfileDetails(item)}
    />
  );

  refreshData = () => {
    const { isRefreshingData } = this.state;

    debugAppLogger({
      info: 'Gonna attempt to refresh - BoardsScreen',
      isRefreshingData,
    });

    if (!isRefreshingData) {
      this.pages.next = 0;
      this.hasMoreData = true;

      this.setState({ isRefreshingData: true });

      this.fetchData();
    }
  };

  render() {
    const { showSnackbar, snackbarMessage, isRefreshingData, isFetchingData } =
      this.state;

    const { items } = this.props;

    // let items = [];

    // if (isDevMode) ({ items } = this.props);

    return (
      <SafeAreaView style={styles.container}>
        {this.postTypes === 'followingPosts' ? (
          <View
            style={{
              height: windowHeight * 0.9,
            }}>
            <FlatList
              contentContainerStyle={{
                // flex: 1,
                paddingHorizontal: 10,
                paddingBottom: windowHeight * 0.15,
              }}
              data={items}
              ItemSeparatorComponent={this.renderItemSeparator}
              ListEmptyComponent={this.renderEmptyView}
              renderItem={this.renderFollowingPostsItem}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshingData}
                  // refreshing={isRefreshingData}
                  onRefresh={this.refreshData}
                  colors={['#212121']}
                  tintColor="#212121"
                />
              }
            />
          </View>
        ) : (
          <MasonryList
            sorted
            // rerender
            columns={2}
            initialNumInColsToRender={this.postTypes === 'nearMePosts' ? 0 : 1}
            containerWidth={windowWidth}
            spacing={1.5}
            images={items}
            backgroundColor="#FFFFFFS"
            // customImageComponent={FastImage}
            imageContainerStyle={{
              borderRadius: 5,
            }}
            // onPressImage={this.showNoteDetails}
            onPressImage={this.handleTap}
            renderIndividualHeader={this.renderItemHeader}
            renderIndividualFooter={this.renderItemFooter}
            masonryFlatListColProps={{
              ListEmptyComponent: this.renderEmptyView,
              refreshControl: (
                <RefreshControl
                  refreshing={isRefreshingData}
                  // refreshing={isRefreshingData}
                  onRefresh={this.refreshData}
                  colors={['#212121']}
                  tintColor="#212121"
                />
              ),
            }}
            onEndReachedThreshold={0.1}
            onEndReached={this.addItems}
          />
        )}

        {isFetchingData && (
          <BottomActivityIndicator
            animatingState={isFetchingData}
            refreshColor="gray"
          />
        )}

        <Snackbar
          visible={showSnackbar}
          onDismiss={this.dismissSnackbar}
          action={{
            label: 'OK',
            onPress: () => this.dismissSnackbar(),
          }}>
          {snackbarMessage}
        </Snackbar>

        <StatusBar barStyle="dark-content" backgroundColor="white" />
      </SafeAreaView>
    );
  }
}

const FollowingPostsItem = ({
  itemData: item,
  pinPostToNote,
  showDetails,
  showCommenPostDetails,
  showProfileDetails,
}) => {
  const {
    imageUrl,
    height,
    width,
    isVideo,
    poster,
    title,
    avatar,
    initials,
    column,
    name,
    displayName,
    user,
    commentsCount,
  } = item;

  const isCommentOnly = !imageUrl;

  debugAppLogger({
    info: `gonna render item ${item.id}`,
  });

  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isProcessingPin, setIsProcessingPin] = useState(false);
  const [likedPost, setLikedPost] = useState(!!item.hasLiked);
  const [likeKey, setLikeKey] = useState((item.hasLiked || false).toString());
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);

  const [pinnedPost, setPinnedPost] = useState(!!item.hasPinned);

  const toggleLike = async () => {
    debugAppLogger({
      info: 'Gonna sync like/unlike',
      itemId: item.id,
    });

    try {
      const newLikeState = !likedPost;
      const newLikesCount = likesCount + (newLikeState ? 1 : -1);

      setIsProcessingLike(true);
      setLikedPost(newLikeState);
      setLikeKey(newLikeState.toString());
      setLikesCount(newLikesCount);
      item.hasLiked = newLikeState;
      item.likesCount = newLikesCount;

      const response = await Parse.Cloud.run('likeOrUnlikePost', {
        postId: item.id,
        like: newLikeState,
      });

      setIsProcessingLike(false);

      debugAppLogger({
        info: 'toggleLike ItemFooter - HomeScreen',
        response,
        newLikeState,
      });
    } catch (error) {
      setLikedPost(likedPost);
      setIsProcessingLike(false);

      debugAppLogger({
        info: 'toggleLike error - HomeScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  const togglePinned = async () => {
    debugAppLogger({
      info: 'Gonna sync pin/unPin',
      itemId: item.id,
    });

    try {
      const newPinnedState = !pinnedPost;

      setIsProcessingPin(true);
      setPinnedPost(newPinnedState);

      item.hasPinned = newPinnedState;

      const Post = Parse.Object.extend('Post');
      const postPointer = new Post();
      postPointer.id = item.id;

      const Board = Parse.Object.extend('Board');
      const boardPointer = new Board();
      boardPointer.id = item.pinnedTo;

      const pinnedRelation = boardPointer.relation('pinnedEnjaga');
      pinnedRelation.remove(postPointer);

      boardPointer.remove('pinnedEnjagaArray', item.id);

      await boardPointer.save();

      setIsProcessingPin(false);

      debugAppLogger({
        info: 'togglePinned ItemFooter - HomeScreen',
        newPinnedState,
      });
    } catch (error) {
      setPinnedPost(pinnedPost);
      setIsProcessingPin(false);

      debugAppLogger({
        info: 'togglePinned error - HomeScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={showDetails}
      style={{
        // flex: 1,
        // width: '100%',
        marginTop: isCommentOnly ? 10 : 6,
        marginBottom: 12,
        // backgroundColor: 'orange',
      }}>
      {!isCommentOnly && (
        <FastImage
          style={[
            // defaultProps.style,
            {
              width: windowWidth - 20,
              height: (windowWidth - 20) * (height / width),
              backgroundColor: '#FBFBFB',
              borderRadius: 5,
              // justifyContent: 'flex-end',
              // paddingLeft: 7,
              // paddingBottom: 5,
            },
          ]}
          source={isVideo && poster ? { uri: poster } : { uri: imageUrl }}
          resizeMode={FastImage.resizeMode.cover}>
          {/* <Text>Enjaga</Text> */}
        </FastImage>
      )}

      <View
        style={{
          paddingRight: 5,
          paddingTop: 10,
          paddingBottom: 5,
          backgroundColor: isCommentOnly ? '#F1F1F1' : undefined,
          marginBottom: isCommentOnly ? 8 : 4,
          borderRadius: isCommentOnly ? 5 : undefined,
          borderWidth: isCommentOnly ? 1 : undefined,
          borderColor: isCommentOnly ? '#CCCCCC' : undefined,
          paddingLeft: isCommentOnly ? 5 : undefined,
          // flex: 1,
          // width: maxHeaderWidth, // enjagaFlex
        }}>
        <Text
          allowFontScaling={false}
          numberOfLines={3}
          style={{
            // maxWidth: maxHeaderWidth,
            fontSize: 12,
            fontWeight: 'bold',
            // marginLeft: 5,
          }}>
          {title}
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
          <TouchableOpacity activeOpacity={0.8} onPress={showProfileDetails}>
            {avatar && avatar.url ? (
              <FastImage
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 25,
                  // marginTop: 5,
                }}
                source={{ uri: avatar.url }}
                resizeMode={FastImage.resizeMode.cover}
                // onError={() => setFailedLoadingAvatar(true)}
              />
            ) : (
              <Avatar.Text
                size={32}
                label={initials}
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
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 7 }}
            onPress={showProfileDetails}>
            <Text
              allowFontScaling={false}
              numberOfLines={2}
              style={{
                fontSize: 10,
                color: '#414141',
                marginLeft: 10,
                maxWidth: windowWidth * 0.15,
              }}>
              {name || displayName || '--'}
            </Text>
          </TouchableOpacity>
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
            {/* <TouchableOpacity
              hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 3,
                marginRight: 5,
              }}
              // onPress={this.showShareSheet}
            >
              <MaterialCommunityIcon
                name="share-variant"
                size={18}
                color="#707070"
              />
            </TouchableOpacity> */}

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isProcessingPin}
              hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 3,
              }}
              // onPress={pinPostToNote}
              onPress={() => {
                if (pinnedPost) {
                  togglePinned();
                } else {
                  pinPostToNote(setPinnedPost);
                }
              }}>
              <MaterialCommunityIcon
                name={pinnedPost ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={pinnedPost ? 'black' : '#707070'}
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
              activeOpacity={0.9}
              disabled={isProcessingLike}
              hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
              style={{
                flexDirection: 'row',
                marginHorizontal: 5,
                paddingHorizontal: 3,
              }}
              onPress={() => toggleLike()}>
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

            {/* <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 3,
              }}
            >
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
                }}
              >
                {commentsCount || 0}
              </Text>
            </View> */}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ItemHeader = ({
  postTypes,
  item,
  pinPostToNote,
  showProfileDetails,
  showCommenPostDetails,
}) => {
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isProcessingPin, setIsProcessingPin] = useState(false);
  const [likedPost, setLikedPost] = useState(!!item.hasLiked);
  const [likeKey, setLikeKey] = useState((item.hasLiked || false).toString());
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);

  const [pinnedPost, setPinnedPost] = useState(!!item.hasPinned);

  const hideBookmarkAction = postTypes === 'nearMePosts';
  const hideLikeAction = postTypes === 'nearMePosts';
  const hideDistanceMarker = postTypes === 'posts';

  // debugAppLogger({
  //   info: 'ItemHeader render',
  //   likedPost,
  //   likeKey,
  //   keyType: typeof likeKey,
  //   enjaga: false,
  //   likesCount,
  //   pinnedPost,
  //   title: item.title,
  // });

  const toggleLike = async () => {
    debugAppLogger({
      info: 'Gonna sync like/unlike',
      itemId: item.id,
    });

    try {
      const newLikeState = !likedPost;
      const newLikesCount = likesCount + (newLikeState ? 1 : -1);

      setIsProcessingLike(true);
      setLikedPost(newLikeState);
      setLikeKey(newLikeState.toString());
      setLikesCount(newLikesCount);
      item.hasLiked = newLikeState;
      item.likesCount = newLikesCount;

      const response = await Parse.Cloud.run('likeOrUnlikePost', {
        postId: item.id,
        like: newLikeState,
      });

      setIsProcessingLike(false);

      debugAppLogger({
        info: 'toggleLike ItemFooter - HomeScreen',
        response,
        newLikeState,
      });
    } catch (error) {
      setLikedPost(likedPost);
      setIsProcessingLike(false);

      debugAppLogger({
        info: 'toggleLike error - HomeScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  const togglePinned = async () => {
    debugAppLogger({
      info: 'Gonna sync pin/unPin',
      itemId: item.id,
    });

    try {
      const newPinnedState = !pinnedPost;

      setIsProcessingPin(true);
      setPinnedPost(newPinnedState);

      item.hasPinned = newPinnedState;

      const Post = Parse.Object.extend('Post');
      const postPointer = new Post();
      postPointer.id = item.id;

      const Board = Parse.Object.extend('Board');
      const boardPointer = new Board();
      boardPointer.id = item.pinnedTo;

      const pinnedRelation = boardPointer.relation('pinnedEnjaga');
      pinnedRelation.remove(postPointer);

      boardPointer.remove('pinnedEnjagaArray', item.id);

      await boardPointer.save();

      setIsProcessingPin(false);

      debugAppLogger({
        info: 'togglePinned ItemFooter - HomeScreen',
        newPinnedState,
      });
    } catch (error) {
      setPinnedPost(pinnedPost);
      setIsProcessingPin(false);

      debugAppLogger({
        info: 'togglePinned error - HomeScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  return (
    <View
      style={{
        margin: 5,
        marginVertical: 10,
        maxWidth: maxHeaderWidth, // enjagaFlex
      }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={showCommenPostDetails}
        style={{
          paddingHorizontal: 5,
          paddingVertical: 10,
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
            // marginLeft: 5,
          }}>
          {item.title}
        </Text>
      </TouchableOpacity>

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
            flex: 0,
            flexDirection: 'row',
            alignItems: 'center',
            // maxWidth: windowWidth * 0.25, // enjagaFlex
            flexBasis: '45%',
            flexGrow: 10,
            // flexShrink: 10,
          }}>
          <TouchableOpacity activeOpacity={0.8} onPress={showProfileDetails}>
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
            ) : (
              <Avatar.Text
                size={24}
                label={item.initials}
                style={{
                  backgroundColor: '#777777',
                  color: 'white',
                }}
              />
            )}
          </TouchableOpacity>

          {(item.column === 0 || true) && (
            <View
              style={{
                marginLeft: 5,
                // maxWidth: windowWidth * 0.15,
                flex: 1,
              }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={showProfileDetails}>
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
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignSelf: 'center',
            justifyContent: 'flex-end',
            flexBasis: '50%', // enjagaFlex
            // overflow: 'hidden',
          }}>
          {!hideBookmarkAction && (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isProcessingPin}
              hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 3,
              }}
              onPress={() => {
                if (pinnedPost) {
                  togglePinned();
                } else {
                  pinPostToNote(setPinnedPost);
                }
              }}>
              <MaterialCommunityIcon
                name={pinnedPost ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={pinnedPost ? 'black' : '#707070'}
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
          )}

          {!hideLikeAction && (
            <TouchableOpacity
              disabled={isProcessingLike}
              hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
              style={{
                flexDirection: 'row',
                marginHorizontal: 5,
                paddingHorizontal: 3,
              }}
              onPress={() => toggleLike()}>
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

          {!hideDistanceMarker && Number.isFinite(item.distance) && (
            <View
              style={{
                flexDirection: 'row',
                paddingLeft: 3,
              }}
              onPress={pinPostToNote}>
              <MaterialCommunityIcon
                name="map-marker"
                size={18}
                color="#707070"
              />

              <Text
                style={{
                  fontSize: 9,
                  alignSelf: 'flex-end',
                  color: '#414141',
                }}>
                {item.distance}km
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const ItemFooter = ({
  postTypes,
  item,
  pinPostToNote,
  showProfileDetails,
  handleTap,
}) => {
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isProcessingPin, setIsProcessingPin] = useState(false);
  const [likedPost, setLikedPost] = useState(!!item.hasLiked);
  const [likeKey, setLikeKey] = useState((item.hasLiked || false).toString());
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);

  const [pinnedPost, setPinnedPost] = useState(!!item.hasPinned);

  const hideBookmarkAction = postTypes === 'nearMePosts';
  const hideLikeAction = postTypes === 'nearMePosts';
  const hideDistanceMarker = postTypes !== 'nearMePosts';

  // debugAppLogger({
  //   info: 'ItemFooter render',
  //   likedPost,
  //   likeKey,
  //   keyType: typeof likeKey,
  //   enjaga: false,
  //   likesCount,
  // });

  const toggleLike = async () => {
    debugAppLogger({
      info: 'Gonna sync like/unlike',
      itemId: item.id,
    });

    const newLikeState = !likedPost;

    try {
      const newLikesCount = likesCount + (newLikeState ? 1 : -1);

      setIsProcessingLike(true);
      setLikedPost(newLikeState);
      setLikeKey(newLikeState.toString());
      setLikesCount(newLikesCount);
      item.hasLiked = newLikeState;
      item.likesCount = newLikesCount;

      const response = await Parse.Cloud.run('likeOrUnlikePost', {
        postId: item.id,
        like: newLikeState,
      });

      setIsProcessingLike(false);

      debugAppLogger({
        info: 'toggleLike ItemFooter - HomeScreen',
        response,
        newLikeState,
      });
    } catch (error) {
      setLikedPost(likedPost);
      setIsProcessingLike(false);

      debugAppLogger({
        info: 'toggleLike error - HomeScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  const togglePinned = async () => {
    debugAppLogger({
      info: 'Gonna sync pin/unPin',
      itemId: item.id,
    });

    try {
      const newPinnedState = !pinnedPost;

      setIsProcessingPin(true);
      setPinnedPost(newPinnedState);

      item.hasPinned = newPinnedState;

      const Post = Parse.Object.extend('Post');
      const postPointer = new Post();
      postPointer.id = item.id;

      const Board = Parse.Object.extend('Board');
      const boardPointer = new Board();
      boardPointer.id = item.pinnedTo;

      const pinnedRelation = boardPointer.relation('pinnedEnjaga');
      pinnedRelation.remove(postPointer);

      boardPointer.remove('pinnedEnjagaArray', item.id);

      await boardPointer.save();

      setIsProcessingPin(false);

      debugAppLogger({
        info: 'togglePinned ItemFooter - HomeScreen',
        newPinnedState,
      });
    } catch (error) {
      setPinnedPost(pinnedPost);
      setIsProcessingPin(false);

      debugAppLogger({
        info: 'togglePinned error - HomeScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  return (
    <View
      style={{
        marginLeft: 5,
        marginTop: 0,
        marginBottom: 10,
        maxWidth: maxFooterWidth, // enjagaFlex
      }}>
      <TouchableOpacity activeOpacity={0.8} onPress={handleTap}>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={{
            // marginTop: 2,
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 'bold',
            color: 'black',
          }}>
          {item.title}
        </Text>
      </TouchableOpacity>

      {/* {!hideDistanceMarker && Number.isFinite(item.distance) && ( */}
      {!hideDistanceMarker && !!item.distance && (
        <View
          style={{
            flexDirection: 'row',
            // paddingLeft: 3,
          }}
          onPress={pinPostToNote}>
          {/* <MaterialCommunityIcon
            name="map-marker"
            size={18}
            color="#707070"
          /> */}

          <Text
            style={{
              fontSize: 11,
              alignSelf: 'flex-end',
              color: '#414141',
            }}>
            {item.distance}km
          </Text>
        </View>
      )}

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
          <TouchableOpacity activeOpacity={0.8} onPress={showProfileDetails}>
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
              onPress={showProfileDetails}>
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
          {!hideBookmarkAction && (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isProcessingPin}
              hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 3,
              }}
              onPress={() => {
                if (pinnedPost) {
                  togglePinned();
                } else {
                  pinPostToNote(setPinnedPost);
                }
              }}>
              <MaterialCommunityIcon
                name={pinnedPost ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={pinnedPost ? 'black' : '#707070'}
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
          )}

          {!hideLikeAction && (
            <TouchableOpacity
              disabled={isProcessingLike}
              hitSlop={{ top: 5, right: 0, bottom: 5, left: 0 }}
              style={{
                flexDirection: 'row',
                marginHorizontal: 5,
                paddingHorizontal: 3,
              }}
              onPress={() => toggleLike()}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

const mapStateToProps = (state, props) => {
  const { route: { params: { postTypes } } = {} } = props;

  const {
    cachedState,
    userState: { locationPreference, userDetails },
  } = state;

  return {
    userDetails,
    locationPreference,
    items: cachedState[postTypes] ?? [],
  };
};

export default connect(mapStateToProps)(HomeScreen);
