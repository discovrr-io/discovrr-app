import React, {
  Component,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Avatar,
} from 'react-native-paper';

import {
  connect,
} from 'react-redux';

import FastImage from 'react-native-fast-image';

import FollowButton from './components/FollowButton';

import {
  windowWidth,
} from './utilities/Constants';

const Parse = require('parse/react-native');

class FollowerScreen extends Component {
  constructor(props) {
    super(props);

    this.params = props?.route?.params ?? {};

    this.userProfileId = props?.userDetails?.profileId ?? 'enjaga';
    const userDetails = props.userDetails ?? {};
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
      info: 'constructor - FollowerScreen',
      isFollowing,
      userProfileId: this.userProfileId,
      isSameSameDonkey,
      followingArray: props.followingArray,
    });

    this.state = {
      isFollowing,
      isFetchingData: true,
      isRefreshingData: false,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    try {
      const Profile = Parse.Object.extend('Profile');
      const profilePointer = new Profile();
      profilePointer.id = this.params.profileId;

      const userRelation = profilePointer.relation(this.params.userTypes);
      const query = userRelation.query();
      const results = await query.find();

      if (Array.isArray(results) && results.length) {
        const items = results.map((item) => {
          const avatar = item.get('avatar');
          const name = item.get('name');
          const surname = item.get('surname');

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
            name,
            id: item.id,
            profileId: item.id,
            text: item.get('message'),
            displayName: item.get('displayName'),
            coverPhoto: item.get('coverPhoto'),
            description: item.get('description'),
            hometown: item.get('hometown'),
          };

          return itemData;
        });

        debugAppLogger({
          info: 'fetchProfileDetails items - FollowerScreen',
          items,
        });

        this.setState({
          items,
        });
      }

      debugAppLogger({
        info: 'fetchProfileDetails - FollowerScreen',
        params: this.params,
        resultsLength: Array.isArray(results) ? results.length : 'Not an array',
        results,
      });

      this.setState({
        isFetchingData: false,
        isRefreshingData: false,
      });
    } catch (error) {
      this.setState({
        isFetchingData: false,
        isRefreshingData: false,
      });

      debugAppLogger({
        info: 'fetchData error - FollowerScreen',
        errorMsg: error.message,
        error,
      });
    }
  }

  refreshData = () => {
    const {
      isRefreshingData,
    } = this.state;

    debugAppLogger({
      info: 'Gonna attempt to refresh - FollowerScreen',
      isRefreshingData,
    });

    if (!isRefreshingData) {
      this.setState({ isRefreshingData: true });

      this.fetchData();
    }
  }

  renderEmptyView = () => (
    <View
      style={{
        flex: 1,
        // height: windowHeight * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 12,
          color: '#777777',
        }}
      >
        {this.params.userTypes === 'following' ? 'Not following' : 'No followers'}
      </Text>
    </View>
  );

  renderItemSeparator = () => (
    <View
      style={{
        marginVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
      }}
    />
  )

  renderItem = ({ item }) => (
    <UserListIem data={item} />
  )

  render() {
    const {
      isFetchingData,
      items,
    } = this.state;

    if (isFetchingData) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator
            animating
            color="black"
            size="large"
          />
        </View>
      );
    }

    const {
      // userDetails,
      isRefreshingData,
    } = this.props;

    return (
      <View
        style={styles.container}
      >
        <FlatList
          contentContainerStyle={{
            // flex: 1,
            paddingHorizontal: 10,
            paddingTop: 10,
            paddingBottom: 20,
          }}
          data={items}
          ItemSeparatorComponent={this.renderItemSeparator}
          ListEmptyComponent={this.renderEmptyView}
          renderItem={this.renderItem}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshingData}
              onRefresh={this.refreshData}
              colors={['#212121']}
              tintColor="#212121"
            />
          )}
        />
      </View>
    );
  }
}

const UserListIem = ({ data }) => {
  debugAppLogger({
    info: 'UserListIem - FollowerScreen',
    data,
  });

  const {
    name,
    initials,
    description,
    avatar,
  } = data;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
      }}
    >
      {avatar?.url ? (
        <FastImage
          style={{
            height: 40,
            width: 40,
            borderRadius: 20,
          }}
          source={{ uri: avatar.url }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <Avatar.Text
          size={32}
          label={initials || '--'}
          style={{
            backgroundColor: '#777777',
            color: 'white',
          }}
        />
      )}

      <View
        style={{
          flex: 1,
          marginLeft: 5,
          // marginVertical: 7,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 25,
            // backgroundColor: 'orange',
          }}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              maxWidth: windowWidth * 0.6, // enjagaTodo make name take entire space if same same donkey
              fontSize: 14,
            }}
          >
            {name}
          </Text>

          <FollowButton
            isFollowerScreen
            userDetails={data}
          />
        </View>

        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={{
            fontSize: 12,
          }}
        >
          {description || '...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
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
  const followingArray = state?.userState?.userDetails?.followingArray ?? [];
  const profileId = state?.userState?.userDetails?.profileId ?? null;

  return ({
    followingArray,
    profileId,
  });
};

export default connect(mapStateToProps)(FollowerScreen);
