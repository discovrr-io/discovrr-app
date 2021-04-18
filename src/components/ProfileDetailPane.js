import React, {
  Component,
} from 'react';

import {
  NativeEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Surface,
} from 'react-native-paper';

import {
  withSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  connect,
} from 'react-redux';

import FastImage from 'react-native-fast-image';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import FollowButton from './FollowButton';

import {
  updateFollowing,
} from '../utilities/Actions';

const Parse = require('parse/react-native');

class ProfileDetailPane extends Component {
  constructor(props) {
    super(props);

    this.bottomSheetEmitter = new NativeEventEmitter('showPanel');

    this.userProfileId = props?.userProfile?.profileId ?? 'enjaga';
    const userDetails = props.userProfile ?? {};
    const isSameSameDonkey = props.profileId === this.userProfileId;
    let isFollowing = false;

    if (
      !isSameSameDonkey
      && Array.isArray(props.followingArray)
      && props.followingArray.includes(this.userProfileId)
    ) {
      isFollowing = true;
    }

    debugAppLogger({
      info: 'constructor - ProfileDetailPane',
      isSameSameDonkey,
      userDetails,
      isFollowing,
      userProfileId: this.userProfileId,
      followingArray: props.followingArray,
      props,
    });

    this.state = {
      userDetails,
      isFollowing,
      isSameSameDonkey,
      isProcessing: false,
    };
  }

  componentDidMount() {
    this.fetchProfileDetails();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    try {
      const {
        isSameSameDonkey,
      } = this.state;

      if (isSameSameDonkey && nextProps.userDetails) {
        this.setState({ userDetails: nextProps.userDetails });
      }
    } catch (e) {
      //
    }
  }

  cacheDimensions = (event) => {
    try {
      const {
        isProcessing,
      } = this.state;

      if (!isProcessing) {
        ({
          nativeEvent: {
            layout: {
              width: this.width,
              height: this.height,
            } = {},
          } = {},
        } = event);

        debugAppLogger({
          info: 'ProfileDetailPane onLayout',
          width: this.width,
          height: this.height,
        });
      }
    } catch (e) {
      //
    }
  }

  toggleFollowing = async () => {
    try {
      this.setState({ isProcessing: true });

      const {
        isFollowing,
        userDetails,
      } = this.state;

      const payload = {
        profileId: this.userProfileId,
        follow: !isFollowing,
      };

      const response = await Parse.Cloud.run('followOrUnfollowProfile', payload);

      this.setState({
        isFollowing: !isFollowing,
        isProcessing: false,
      });

      const {
        followingArray,
        dispatch,
      } = this.props;

      const newFollowingArray = Array.isArray(followingArray) ? [...followingArray] : [];

      debugAppLogger({
        info: 'toggleFollowing before  - ProfileDetailPane',
        followingArray,
        newFollowingArray,
      });
      if (isFollowing) {
        const index = newFollowingArray.findIndex((id) => id === this.userProfileId);

        if (index !== -1) newFollowingArray.splice(index, 1);

        if (Number.isFinite(userDetails.followersCount)) {
          // alert('gonna deduct since was followingArray')
          userDetails.followersCount -= 1;
        } else {
          // alert(`Skipped deduction -> ${userDetails.followersCount}`);
        }
      } else {
        newFollowingArray.push(this.userProfileId);

        if (Number.isFinite(userDetails.followersCount)) {
          // alert('gonna add since was not following')
          userDetails.followersCount += 1;
        } else {
          // alert(`Skipped adding -> ${userDetails.followersCount}`);
        }
      }

      this.setState({
        userDetails,
      });

      dispatch(updateFollowing(newFollowingArray));

      debugAppLogger({
        info: 'toggleFollowing after - ProfileDetailPane',
        response,
        newFollowingArray,
      });
    } catch (error) {
      this.setState({
        isProcessing: false,
      });

      debugAppLogger({
        info: 'toggleFollowing Error - ProfileDetailPane',
        errorMsg: error.message,
        error,
      });
    }
  }

  updateFollowCount = (isFollowing) => {
    try {
      const {
        userDetails,
      } = this.state;

      if (Number.isFinite(userDetails.followersCount)) {
        if (isFollowing) {
          userDetails.followersCount -= 1;
        } else {
          userDetails.followersCount += 1;
        }
      }

      this.setState({
        userDetails,
      });
    } catch (e) {
      //
    }
  }

  fetchProfileDetails = async () => {
    try {
      const {
        userDetails,
      } = this.state;

      const postPointer = {
        __type: 'Pointer',
        className: 'Profile',
        objectId: userDetails.profileId,
      };

      const query = new Parse.Query(Parse.Object.extend('Profile'));
      query.equalTo('objectId', userDetails.profileId);
      query.equalTo('status', 0);

      const result = await query.first();

      debugAppLogger({
        info: 'fetchProfileDetails - ProfileDetailPane',
        result,
      });

      if (result && typeof result === 'object') {
        const tempUserDetails = { ...userDetails };
        // tempUserDetails.followingCount = result.get('followingCount') || 0;
        // tempUserDetails.followersCount = result.get('followingCount') || 0;

        const followingArray = result.get('followingArray');
        tempUserDetails.followingCount = Array.isArray(followingArray) ? followingArray.length : 0;

        const followersArray = result.get('followersArray');
        tempUserDetails.followersCount = Array.isArray(followersArray) ? followersArray.length : 0;

        this.setState({
          userDetails: tempUserDetails,
        });
      }

      debugAppLogger({
        info: 'fetchProfileDetails - ProfileDetailPane',
        result,
      });
    } catch (error) {
        //
    }
  }

  showUsers = (userTypes) => () => {
    try {
      const {
        userDetails,
      } = this.state;

      const payload = {
        userTypes,
        title: userTypes === 'following' ? 'Following' : 'Followers',
        avatar: userDetails?.avatar?.url ?? null,
        profileId: userDetails?.profileId ?? null,
      };

      const {
        navigate,
      } = this.props;

      navigate('FollowerScreen', payload);
    } catch (error) {
      //
    }
  }

  showOnMap = () => {
    try {
      const {
        userDetails,
      } = this.state;

      debugAppLogger({
        info: 'Gonna show location on maps - ProfileDetailPane',
        userDetails,
      });

      this.bottomSheetEmitter.emit(
        'showPanel',
        {
          extraData: { ...userDetails },
          contentSelector: 'showOnMap',
        },
      );

      this.closeDrawer();
    } catch (e) {
      //
    }
  }

  performProfileAction = () => {
    const {
      userDetails: {
        isVendor,
      } = {},
    } = this.state;

    if (isVendor) {
      this.showOnMap();
    } else {
      const {
        navigate,
      } = this.props;

      navigate('ProfileEditScreen');
    }
  }

  render() {
    const {
      isFollowing,
      isSameSameDonkey,
      isProcessing,
      userDetails,
    } = this.state;

    const {
      insets,
      // userDetails,
      avatarImage,
      navigate,
      pop,
      showMessage,
    } = this.props;

    const {
      displayName,
      name,
      followingCount,
      followersCount,
      description,
      hometown,
      isUserProfile,
      isVendor,
      avatar,
    } = userDetails;

    debugAppLogger({
      info: 'render - ProfileDetailPane',
      isSameSameDonkey,
    });

    const avatarSource = isSameSameDonkey && avatar && avatar.url ? { uri: avatar.url } : avatarImage;

    return (
      <>
        {isUserProfile && false ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              // flex: 0,
              // backgroundColor: 'green',
              alignSelf: 'flex-end',
              marginTop: insets.top ? insets.top + 10 : 20,
              marginRight: 10,
            }}
            onPress={() => pop()}
          >
            <Surface
              style={{
                // position: 'absolute',
                // top: '3%',
                // left: '5%',
                padding: 4,
                borderRadius: 15,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <MaterialCommunityIcon
                // ref={this.refSelector('coverPhotoRef')}
                name="close"
                size={20}
                color="white"
              />
            </Surface>
          </TouchableOpacity>
        ) : (
          <View style={{ height: 2 }} />
        )}

        <View
          style={{
            paddingVertical: 5,
            paddingHorizontal: 15,
            // backgroundColor: 'rgba(114, 114, 114, 0.49)',
            backgroundColor: 'rgba(114, 114, 114, 0.59)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1.2 }}>
              <FastImage
                source={avatarSource}
                resizeMode={FastImage.resizeMode.cover}
                style={{
                  backgroundColor: 'white',
                  width: 90,
                  height: 90,
                  borderRadius: 50,
                }}
              />

              {/* <Text style={{ fontSize: 18, color: 'white' }}>{name || displayName}</Text> */}

              {/* <Text numberOfLines={1} style={{ fontSize: 12, color: 'white' }}>
                {hometown || '...'}
              </Text> */}
            </View>

            <View
              style={{
                flex: 2,
              }}
            >
              <View
                style={{
                  // flex: 2,
                  flexDirection: 'row',
                  paddingTop: 5,
                  marginLeft: 10,
                  // marginTop: 25,
                  // marginBottom: 5,
                  // alignSelf: 'flex-start',
                  // backgroundColor: 'green',
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{ alignItems: 'center' }}
                  // disabled
                  onPress={this.showUsers('following')}
                >
                  <Text allowFontScaling={false} style={{ fontSize: 10, color: 'white' }}>
                    Following
                  </Text>

                  <Text allowFontScaling={false} style={{ fontWeight: 'bold', color: 'white' }}>
                    {followingCount || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{ alignItems: 'center', marginLeft: 25 }}
                  // disabled
                  onPress={this.showUsers('followers')}
                >
                  <Text allowFontScaling={false} style={{ fontSize: 10, color: 'white' }}>
                    Followers
                  </Text>

                  <Text allowFontScaling={false} style={{ fontWeight: 'bold', color: 'white' }}>
                    {followersCount || 0}
                  </Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'center', marginLeft: 25 }}>
                  <Text allowFontScaling={false} style={{ fontSize: 10, color: 'white' }}>
                    Likes
                  </Text>

                  <Text allowFontScaling={false} style={{ fontWeight: 'bold', color: 'white' }}>
                    { '--' || 0}
                  </Text>
                </View>
              </View>

              {!!isUserProfile && (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 20,
                  }}
                >

                  {/* <TouchableOpacity
                    activeOpacity={0.8} // FastImage
                    style={{
                      // marginTop: 20 + ((insets && insets.top && insets.top + 10) || 0),
                      // marginTop: stackHeaderHeight,
                      marginRight: 10,
                      paddingHorizontal: 15,
                      paddingVertical: 5,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#00D8C6',
                      backgroundColor: isFollowing ? '#00D8C6' : 'rgba(97, 95, 95, 0.48)',
                      alignSelf: 'flex-end',
                    }}
                    onPress={() => showMessage('Following pending implementation')()}
                  >
                    <Text allowFontScaling={false} style={{ fontSize: 11, fontWeight: 'normal', color: 'white' }}>
                      {isFollowing ? 'Follow' : 'Following'}
                    </Text>
                  </TouchableOpacity> */}

                  {!isVendor && (
                    <FollowButton
                      isProfileScreen
                      userDetails={userDetails}
                      afterAction={this.updateFollowCount}
                    />
                  )}

                  {/* <TouchableOpacity
                    activeOpacity={0.8} // FastImage
                    style={{
                      // marginTop: 20 + ((insets && insets.top && insets.top + 10) || 0),
                      // marginTop: stackHeaderHeight,
                      marginRight: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: 'white',
                      backgroundColor: 'rgba(97, 95, 95, 0.48)',
                      alignSelf: 'flex-end',
                    }}
                    onPress={() => navigate('ChatMessageScreen', { chatPartner: userDetails })}
                  >
                    <Text allowFontScaling={false} style={{ fontSize: 11, color: 'white' }}>
                      Message
                    </Text>
                  </TouchableOpacity> */}
                </View>
              )}

            </View>

            {!!(!isUserProfile || isVendor) && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  flex: 0,
                  // backgroundColor: 'green',
                }}
                onPress={this.performProfileAction}
              >
                <Surface
                  style={{
                    // position: 'absolute',
                    // top: '3%',
                    // left: '5%',
                    padding: 4,
                    borderRadius: 15,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <MaterialCommunityIcon
                    // ref={this.refSelector('coverPhotoRef')}
                    name={isVendor ? 'map-marker' : 'pencil'}
                    size={20}
                    color="white"
                  />
                </Surface>
              </TouchableOpacity>
            )}
          </View>

          <Text style={{ fontSize: 18, color: 'white' }}>{name || displayName}</Text>

          {!!(isVendor && hometown) && (
            <Text numberOfLines={3} style={{ fontSize: 12, color: 'white' }}>
              {hometown}
            </Text>
          )}

          <Text
            numberOfLines={3}
            style={{
              fontSize: 12,
              color: 'white',
              marginTop: 5,
            }}
          >
            {description || '...'}
          </Text>
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  postDetailButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#707070',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postDetailButtonLabel: {
    fontSize: 10,
    fontWeight: 'normal',
    color: 'black',
  },
  profileButton: {
    marginRight: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00D8C6',
    // backgroundColor: isFollowing ? '#00D8C6' : 'rgba(97, 95, 95, 0.48)',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonLabel: {
    fontSize: 11, fontWeight: 'normal', color: 'white',
  },
});

const mapStateToProps = (state) => {
  const {
    userState: {
      userDetails = {},
    } = {},
  } = state;

  const followingArray = state?.userState?.userDetails?.followingArray ?? [];
  const profileId = state?.userState?.userDetails?.profileId ?? null;

  return ({
    followingArray,
    profileId,
    userDetails,
  });
};

export default connect(mapStateToProps)(withSafeAreaInsets(ProfileDetailPane));
