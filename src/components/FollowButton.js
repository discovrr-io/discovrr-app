import React, {
  Component,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import {
  connect,
} from 'react-redux';

import {
  updateFollowing,
} from '../utilities/Actions';

const Parse = require('parse/react-native');

class FollowButton extends Component {
  constructor(props) {
    super(props);

    this.userProfileId = props?.userDetails?.profileId ?? 'enjaga';
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
      info: 'constructor - FollowButton',
      isFollowing,
      userProfileId: this.userProfileId,
      isSameSameDonkey,
      followingArray: props.followingArray,
      userDetails: props.userDetails,
    });

    this.state = {
      isFollowing,
      isSameSameDonkey,
      isProcessing: false,
    };
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
          info: 'FollowButton onLayout',
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
      } = this.state;

      const payload = {
        profileId: this.userProfileId,
        follow: !isFollowing,
        // follow: true,
      };

      const response = await Parse.Cloud.run('followOrUnfollowProfile', payload);

      this.setState({
        isFollowing: !isFollowing,
        isProcessing: false,
      });

      const {
        followingArray,
        dispatch,
        afterAction,
      } = this.props;

      const newFollowingArray = Array.isArray(followingArray) ? [...followingArray] : [];

      debugAppLogger({
        info: 'toggleFollowing before  - FollowButton',
        followingArray,
        newFollowingArray,
      });

      if (isFollowing) {
        const index = newFollowingArray.findIndex((id) => id === this.userProfileId);

        if (index !== -1) newFollowingArray.splice(index, 1);
      } else {
        newFollowingArray.push(this.userProfileId);
      }

      if (typeof afterAction === 'function') afterAction(isFollowing);

      dispatch(updateFollowing(newFollowingArray));

      debugAppLogger({
        info: 'toggleFollowing after - FollowButton',
        response,
        newFollowingArray,
      });
    } catch (error) {
      this.setState({
        isProcessing: false,
      });

      debugAppLogger({
        info: 'toggleFollowing Error - FollowButton',
        errorMsg: error.message,
        error,
      });
    }
  }

  render() {
    const {
      isFollowing,
      isSameSameDonkey,
      isProcessing,
    } = this.state;

    if (isSameSameDonkey) return null;

    const {
      isProfileScreen = false,
      isFollowerScreen = false,
    } = this.props;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isProcessing}
        style={(isProfileScreen || isFollowerScreen)
          ? [
            styles.profileButton,
            {
              width: isProcessing && this.width ? this.width : undefined,
              height: isProcessing && this.height ? this.height : undefined,
              marginRight: isProfileScreen ? 10 : 0,
            },
          ]
          : [
            styles.postDetailButton,
            {
              width: isProcessing && this.width ? this.width : undefined,
              height: isProcessing && this.height ? this.height : undefined,
            },
          ]}
        onLayout={this.cacheDimensions}
        onPress={this.toggleFollowing}
      >
        {isProcessing ? (
          <ActivityIndicator
            animating
            color={(isProfileScreen || isFollowerScreen) ? 'white' : 'black'}
            size="small"
            style={{
              transform: [{ scale: 0.6 }],
              // marginLeft: 4,
              // paddingVertical: 2,
            }}
          />
        ) : (
          <Text
            allowFontScaling={false}
            style={(isProfileScreen || isFollowerScreen)
              ? styles.profileButtonLabel
              : styles.postDetailButtonLabel}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
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
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00D8C6',
    backgroundColor: '#00D8C6',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonLabel: {
    fontSize: 11,
    fontWeight: 'normal',
    color: 'white',
  },
});

const mapStateToProps = (state) => {
  const followingArray = state?.userState?.userDetails?.followingArray ?? [];
  const profileId = state?.userState?.userDetails?.profileId ?? null;

  return ({
    followingArray,
    profileId,
  });
};

export default connect(mapStateToProps)(FollowButton);
