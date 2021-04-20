import React, { Component, useState } from 'react';

import {
  Alert,
  BackHandler,
  NativeEventEmitter,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Avatar, Surface, Switch } from 'react-native-paper';
import { connect } from 'react-redux';
import { Placeholder, PlaceholderMedia, Fade } from 'rn-placeholder';
import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import MasonryList from 'react-native-masonry-list';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons';
import RNPopoverMenu from 'react-native-popover-menu';

import { isAndroid, windowWidth, windowHeight } from './utilities/Constants';
import BottomActivityIndicator from './components/BottomActivityIndicator';

const Parse = require('parse/react-native');

const deleteIcon = <MaterialIcon name="delete" color="#000000" size={24} />;
const editIcon = <MaterialIcon name="create" color="#000000" size={24} />;

const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');
const imagePlaceholder = require('../resources/images/imagePlaceholder.png');

const vpWidth = windowWidth * 0.5 - 15;

const maxHeaderWidth = windowWidth * 0.465;
const maxFooterWidth = windowWidth * 0.475;

const isDevMode = process.env.NODE_ENV === 'development';

class NoteDetailScreen extends Component {
  constructor(props) {
    super(props);

    ({
      navigation: { navigate: this.navigate, setOptions: this.setOptions },
      route: { params: this.noteDetails },
    } = props);

    this.profileId = props.userDetails?.profileId ?? null;
    this.noteOwnerProfileId = this.noteDetails?.noteOwnerProfileId ?? null;

    this.isOwner = false;
    if (
      this.profileId &&
      this.noteOwnerProfileId &&
      this.profileId === this.noteOwnerProfileId
    ) {
      this.isOwner = true;
    }

    this.bottomSheetEmitter = new NativeEventEmitter('showPanel');

    this.state = {
      isFetchingData: true,
      isRefreshingData: false,
      items: [],
      noteVisibility: !props.route.params?.isPrivate ?? true,
    };

    debugAppLogger({
      info: 'constructor - NoteDetailScreen',
      props,
    });
  }

  componentDidMount() {
    if (isAndroid)
      BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);

    if (this.isOwner) {
      this.setOptions({
        headerRight: () => (
          <TouchableOpacity
            ref={this.refSelector('headerRightRef')}
            style={{ marginRight: 15 }}
            onPress={this.showNoteActionMenu}>
            <MaterialCommunityIcon
              name="dots-horizontal"
              size={26}
              color="gray"
            />
          </TouchableOpacity>
        ),
      });
    }

    this.fetchData();
  }

  componentWillUnmount() {
    if (isAndroid)
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackPress,
      );
  }

  refSelector = (selector) => (compRef) => {
    this[selector] = compRef;
  };

  handleBackPress = () => {
    try {
      // const {
      //   isProcessing,
      //   snapId,
      // } = this.state;
      //
      // if (isProcessing) return true;
      //
      // if (snapId !== 'bottom') {
      //   this.refs.interactableRef.snapTo({ index: 1 });
      //
      //   // this.setState({
      //   //   isLoggingIn: false,
      //   //   snapId: 'bottom',
      //   // });
      //
      //   return true;
      // }
    } catch (e) {
      //
    }

    return false;
  };

  fetchData = async () => {
    let query;

    try {
      // query = new Parse.Query(Parse.Object.extend('Post'));
      // query.equalTo('boardIdDelete', this.noteDetails.id);
      // query.include('profile');

      const Board = Parse.Object.extend('Board');
      const boardPointer = new Board();
      boardPointer.id = this.noteDetails.id;

      const pinnedPostRelation = boardPointer.relation('pinnedEnjaga');
      query = pinnedPostRelation.query();
      const results = await query.find();

      // if (!isDevMode) query.equalTo('status', 0);
      //
      // query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
      //
      // query.descending('createdAt');
      //
      // const results = await query.find();

      debugAppLogger({
        info: 'fetchData - NoteDetailScreen',
        length: Array.isArray(results) ? results.length : 'Not proper results',
        results,
      });

      if (Array.isArray(results) && results.length) {
        const {
          userDetails: { userId, profileId },
        } = this.props;

        const items = results.map((item) => {
          const hasProfile = !!item.get('profile');

          const images = item.get('media');
          if (Array.isArray(images) && images.length) {
            images.forEach(({ type }, i) => {
              if (type === 'video') images[i].isVideo = true;
            });

            if (isDevMode && false) images[0].isVideo = true;
          }

          const firstImage =
            (Array.isArray(images) && images.length && images[0]) || null;
          const imageUrl = firstImage?.url ?? null;

          const source = imageUrl ? { uri: imageUrl } : imagePlaceholder;

          let likesCount = 0;
          let hasLiked = false;
          const likersArray = item.get('likersArray');

          let poster;

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

        this.setState({
          items,
        });

        debugAppLogger({
          info: 'fetchData transformed - NoteDetailScreen',
          distance: items[0].distance,
          firstItem: items[0],
        });
      } else {
        this.setState({
          mansoryKey: Date.now(),
          items: [],
        });
      }

      this.setState({
        isFetchingData: false,
        isRefreshingData: false,
      });
    } catch (error) {
      debugAppLogger({
        info: 'fetchData Error - NoteDetailScreen',
        errorMsg: error.message,
        error,
      });

      this.setState({
        mansoryKey: Date.now(),
        isFetchingData: false,
        isRefreshingData: false,
      });
      //
    }
  };

  toggleSwitch = (selector) => () => {
    this.setState(({ [`${selector}`]: value }) => ({
      [`${selector}`]: !value,
    }));
  };

  showShareSheet = () => {
    try {
      this.bottomSheetEmitter.emit('showPanel', {
        contentSelector: 'shareSheet',
        onFinish: (data) => {
          debugAppLogger({
            info: 'inside onFinish',
            data,
          });
          // this.hasEnjagad = false;
          // this.setState({
          //   masonryKey: Date.now(),
          // });
        },
      });
    } catch (e) {
      //
    }
  };

  showEditNoteSheet = () => {
    try {
      this.bottomSheetEmitter.emit('showPanel', {
        extraData: this.noteDetails,
        contentSelector: 'editNote',
        onFinish: (data) => {
          debugAppLogger({
            info: 'inside onFinish',
            data,
          });

          this.noteDetails = {
            ...this.noteDetails,
            ...data,
          };

          this.setState({
            noteVisibility: !data.isPrivate,
          });

          if (data.image) {
            this.setOptions({
              headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FastImage
                    style={{ width: 40, height: 40, marginRight: 15 }}
                    source={
                      data.image ? { uri: data.image.url } : imagePlaceholder
                    }
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <Text allowFontScaling={false}>{data.title}</Text>
                </View>
              ),
            });
          } else if (data.title) {
            this.setOptions({
              title: data.title,
            });
          }
        },
      });
    } catch (e) {
      //
    }
  };

  showNoteActionMenu = () => {
    try {
      RNPopoverMenu.Show(this.headerRightRef, {
        tintColor: '#FAFAFA',
        textColor: '#000000',
        title: 'Select from',
        menus: [
          {
            menus: [
              {
                label: 'Edit Note',
                icon: editIcon,
              },
              {
                label: 'Delete Note',
                icon: deleteIcon,
              },
            ],
          },
        ],
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
              'Delete Note?',
              'Please confirm deletion of this note',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  style: 'ok',
                  // onPress: () => this.logout(),
                },
              ],
              {
                cancelable: true,
              },
            );
          } else {
            this.showEditNoteSheet();
          }
        },
        onCancel: () => {},
      });
    } catch (e) {
      //
    }
  };

  showDetails = (data) => () => {
    debugAppLogger({
      info: 'NoteDetailScreen showDetails',
      data,
    });
  };

  showCommenPostDetails = (dataItem) => () => {
    const data = {
      ...dataItem,
      pinPostToNote: () => this.pinPostToNote(dataItem),
    };

    this.navigate('PostDetailScreen', data);
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
    });
  };

  handleTapEnjaga = (dataItem) => () => {
    this.handleTap(dataItem);
  };

  handleTap = (dataItem) => {
    this.navigate('PostDetailScreen', dataItem);
  };

  renderEmptyView = () => (
    <View
      style={{
        flex: 1,
        height: windowHeight * (!this.isOwner ? 0.8 : 0.7),
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 12,
          color: '#777777',
        }}>
        {this.isOwner
          ? "You don't have any items in this note yet"
          : 'No items in this note yet'}
      </Text>
    </View>
  );

  renderItemHeader = (item) => {
    if (item.imageUrl) return null;

    return (
      <ItemHeader
        postTypes={this.postTypes}
        item={item}
        // pinPostToNote={this.pinPostToNote(item)}
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
        // pinPostToNote={this.pinPostToNote(item)}
        showCommenPostDetails={this.showCommenPostDetails(item)}
        showProfileDetails={this.showProfileDetails(item)}
        handleTap={this.handleTapEnjaga(item)}
      />
    );
  };

  refreshData = () => {
    const { isRefreshingData, isFetchingData } = this.state;

    if (!isRefreshingData && !isFetchingData) {
      this.setState({ isRefreshingData: true });

      this.fetchData();
    }
  };

  render() {
    const {
      mansoryKey,
      noteVisibility,
      isFetchingData,
      isRefreshingData,
      items,
    } = this.state;

    const {
      userDetails: {
        profileId,
        surname,
        name,
        displayName,
        avatar: { url: avatarUrl } = {},
      } = {},
    } = this.props;

    const avatarImage = avatarUrl ? { uri: avatarUrl } : defaultAvatar;

    return (
      <View style={styles.container}>
        {!!this.isOwner && (
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '90%',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: '#EEEEEE',
            }}>
            <Text
              allowFontScaling={false}
              style={{
                color: '#727272',
                fontSize: 10,
                marginBottom: 5,
              }}>
              You have shared this note with...
            </Text>

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
                <View
                  style={{
                    alignItems: 'center',
                  }}>
                  <FastImage
                    style={{ width: 30, height: 30, borderRadius: 15 }}
                    source={avatarImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />

                  <Text
                    allowFontScaling={false}
                    style={{
                      color: '#727272',
                      fontSize: 10,
                    }}>
                    {surname || name || displayName || '--'}
                  </Text>
                </View>

                <View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      alignItems: 'center',
                      marginLeft: 5,
                    }}
                    onPress={this.showShareSheet}>
                    <MaterialIcon name="add" size={26} color="gray" />
                  </TouchableOpacity>

                  <Text
                    allowFontScaling={false}
                    style={{
                      color: '#727272',
                      fontSize: 10,
                    }}>
                    {' '}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={{ alignItems: 'center' }}
                onPress={this.showEditNoteSheet}>
                <Switch
                  disabled
                  color="#00D8C6"
                  value={noteVisibility}
                  onValueChange={this.toggleSwitch('noteVisibility')}
                />

                <Text
                  allowFontScaling={false}
                  style={{
                    marginTop: 5,
                    fontSize: 10,
                    color: 'black',
                  }}>
                  {noteVisibility ? 'Public' : 'Private'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingBottom: '15%',
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 12,
              color: '#555555',
            }}
          >
            {this.isOwner
              ? 'You don\'t have any items in this note yet'
              : 'No items in this note yet'}
          </Text>
        </View> */}

        <MasonryList
          key={mansoryKey}
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
          // onPressImage={this.showNoteDetails}
          onPressImage={this.handleTap}
          renderIndividualHeader={this.renderItemHeader}
          renderIndividualFooter={this.renderItemFooter}
          masonryFlatListColProps={{
            ListEmptyComponent: this.renderEmptyView,
            removeClippedSubviews: isAndroid,
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
          // onEndReached={this.addItems}
        />

        {isFetchingData && (
          <BottomActivityIndicator
            animatingState={isFetchingData}
            refreshColor="gray"
          />
        )}
      </View>
    );
  }
}

const ItemHeader = ({
  postTypes,
  item,
  // pinPostToNote,
  showProfileDetails,
  showCommenPostDetails,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [likedPost, setLikedPost] = useState(false);
  const [likeKey, setLikeKey] = useState((item.hasLiked || false).toString());
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);

  const hideBookmarkAction = postTypes === 'nearMePosts' || true;
  const hideLikeAction = postTypes === 'nearMePosts' || true;
  const hideDistanceMarker = postTypes === 'posts' || true;

  const toggleLike = async () => {
    debugAppLogger({
      info: 'Gonna sync like/unlike',
      itemId: item.id,
    });

    try {
      const newLikeState = !likedPost;
      const newLikesCount = likesCount + (newLikeState ? 1 : -1);

      setIsProcessing(true);
      setLikedPost(newLikeState);
      setLikeKey(newLikeState.toString());
      setLikesCount(newLikesCount);
      item.hasLiked = newLikeState;
      item.likesCount = newLikesCount;

      const response = await Parse.Cloud.run('likeOrUnlikePost', {
        postId: item.id,
        like: newLikeState,
      });

      setIsProcessing(false);

      debugAppLogger({
        info: 'toggleLike ItemFooter - HomeScreen',
        response,
        newLikeState,
      });
    } catch (error) {
      setIsProcessing(false);
      debugAppLogger({
        info: 'toggleLike error - HomeScreen',
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

          {!hideLikeAction && (
            <TouchableOpacity
              disabled={isProcessing}
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
              // onPress={pinPostToNote}
            >
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
  // pinPostToNote,
  showProfileDetails,
  handleTap,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [likedPost, setLikedPost] = useState(!!item.hasLiked);
  const [likeKey, setLikeKey] = useState((item.hasLiked || false).toString());
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);

  const hideBookmarkAction = postTypes === 'nearMePosts' || true;
  const hideLikeAction = postTypes === 'nearMePosts' || true;
  const hideDistanceMarker = postTypes !== 'nearMePosts' || true;

  const toggleLike = async () => {
    debugAppLogger({
      info: 'Gonna sync like/unlike',
      itemId: item.id,
    });

    try {
      const newLikeState = !likedPost;
      const newLikesCount = likesCount + (newLikeState ? 1 : -1);

      setIsProcessing(true);
      setLikedPost(newLikeState);
      setLikeKey(newLikeState.toString());
      setLikesCount(newLikesCount);
      item.hasLiked = newLikeState;
      item.likesCount = newLikesCount;

      const response = await Parse.Cloud.run('likeOrUnlikePost', {
        postId: item.id,
        like: newLikeState,
      });

      setIsProcessing(false);

      debugAppLogger({
        info: 'toggleLike ItemFooter - HomeScreen',
        response,
        newLikeState,
      });
    } catch (error) {
      setIsProcessing(false);
      debugAppLogger({
        info: 'toggleLike error - HomeScreen',
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
          // onPress={pinPostToNote}
        >
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

          {!hideLikeAction && (
            <TouchableOpacity
              disabled={isProcessing}
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

const ImageItem = ({ data: { imageUrl, title } }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      <FastImage
        style={styles.img}
        source={{ uri: imageUrl }}
        resizeMode={FastImage.resizeMode.cover}
        onLoad={() => setImageLoaded(true)}>
        <View style={styles.imageOverlayContainer}>
          {!!title && (
            <Text allowFontScaling={false} style={styles.noteTitle}>
              {title}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 7,
              marginBottom: 7,
            }}
          />
        </View>
      </FastImage>

      {!imageLoaded && false && (
        <Placeholder Animation={Fade}>
          <PlaceholderMedia style={{ width: '100%', height: '100%' }} />
        </Placeholder>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  img: {
    borderRadius: 5,
    flex: 1,
  },
  card: {
    margin: 8,
    marginBottom: 0,
    width: vpWidth,
    // shadowColor: '#0000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    elevation: 5,
    // backgroundColor: 'white',
    borderRadius: 5,
  },
  imageOverlayContainer: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    // backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignSelf: 'flex-start',
  },
});

const mapStateToProps = (state) => {
  const { userState: { userDetails = {} } = {} } = state;

  return {
    userDetails,
  };
};

export default connect(mapStateToProps)(NoteDetailScreen);
