import React, { Component, useState } from 'react';

import {
  BackHandler,
  DeviceEventEmitter,
  NativeEventEmitter,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MasonryList from 'react-native-masonry-list';

import { connect } from 'react-redux';

import { Placeholder, PlaceholderMedia, Fade } from 'rn-placeholder';
import { isAndroid, windowWidth, windowHeight } from './utilities/Constants';
import { updateNotes } from './utilities/Actions';
import { fetchNotes } from './utilities/NetworkRequests';

import { NoteItem } from './components';
import { colors, values, typography } from './constants';

const Parse = require('parse/react-native');

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');

const vpWidth = windowWidth * 0.5 - 15;

class BoardsScreen extends Component {
  constructor(props) {
    super(props);

    ({
      dispatch: this.dispatch,
      navigation: { navigate: this.navigate },
    } = props);

    debugAppLogger({
      props,
    });

    this.bottomSheetEmitter = new NativeEventEmitter('showPanel');

    this.state = {
      // notes: [],
      // masonryKey: Date.now(),
    };
  }

  componentDidMount() {
    if (isAndroid)
      BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);

    DeviceEventEmitter.addListener('refreshNotes', this.refreshData);

    // fetchNotes();
    this.fetchData();
  }

  componentWillUnmount() {
    if (isAndroid)
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackPress,
      );

    DeviceEventEmitter.removeListener('refreshNotes', this.refreshData);
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
      Parse.User.currentAsync()
        .then(async (currentUser) => {
          if (currentUser) {
            query = new Parse.Query(Parse.Object.extend('Board'));
            query.equalTo('owner', currentUser);
            query.equalTo('status', 0);
            const results = await query.find();

            if (Array.isArray(results) && results.length) {
              const notes = results.map((note) => {
                const imagePreviewData = note.get('image');
                const imagePreviewUrl = imagePreviewData?.url;
                const imagePreviewSource = imagePreviewUrl
                  ? { uri: imagePreviewUrl }
                  : imagePlaceholder;
                const imagePreviewDimensions = {
                  width: imagePreviewData?.width ?? 800,
                  height: imagePreviewData?.height ?? 600,
                };

                return {
                  id: note.id,
                  title: note.get('title'),
                  isPrivate: note.get('private'),
                  source: imagePreviewSource,
                  dimensions: imagePreviewDimensions,
                };
              });

              if (Array.isArray(notes) && notes.length)
                this.dispatch(updateNotes(notes));

              debugAppLogger({
                info: 'BoardsScreen fetchData',
                notes,
              });
            } else {
              this.dispatch(updateNotes([]));
            }
          }

          this.setState({
            isRefreshingData: false,
          });
        })
        .catch((error) => {
          // alert(error.message);

          this.setState({
            isRefreshingData: false,
          });
        });
    } catch (error) {
      //
    }
  };

  showNoteCreationSheet = () => {
    try {
      this.bottomSheetEmitter.emit('showPanel', {
        contentSelector: 'createNote',
        onFinish: () => {
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

  showNoteDetails = (data) => {
    this.navigate('NoteDetailScreen', { noteDetails: data });
  };

  renderEmptyView = () => (
    <View
      style={{
        flex: 1,
        height: windowHeight * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>No notes</Text>
    </View>
  );

  refreshData = () => {
    const { isRefreshingData } = this.state;

    debugAppLogger({
      info: 'Gonna attempt to refresh - BoardsScreen',
      isRefreshingData,
    });

    if (!isRefreshingData) {
      this.setState({ isRefreshingData: true });

      this.fetchData();
    }
  };

  render() {
    const { isRefreshingData } = this.state;

    const { notes } = this.props;

    debugAppLogger({
      info: 'renderNotes - ProfileScreen2',
      notes,
    });

    return (
      <View style={styles.container}>
        <View
          style={{
            alignSelf: 'center',
            width: '90%',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: '#EEEEEE',
            marginBottom: 5,
          }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}
            onPress={this.showNoteCreationSheet}>
            <MaterialIcon name="add" size={32} color="gray" />

            <Text style={{ fontSize: 18, marginLeft: 10 }}>Create a note</Text>
          </TouchableOpacity>
        </View>

        <MasonryList
          sorted
          rerender
          // key={masonryKey}
          columns={2}
          containerWidth={windowWidth}
          spacing={2}
          images={notes}
          backgroundColor="#FFF"
          // customImageComponent={FastImage}
          imageContainerStyle={{
            borderRadius: 5,
          }}
          listContainerStyle={{
            paddingBottom: 10,
          }}
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
          completeCustomComponent={({ data }) => (
            <NoteItem
              id={data.id}
              title={data.title}
              imagePreview={data.source}
              imagePreviewDimensions={data.masonryDimensions}
              onPressNote={this.showNoteDetails}
              style={{ marginHorizontal: values.spacing.xs * 1.1 }}
            />
          )}
        />
      </View>
    );
  }
}

const ImageItem = ({ data: { imageUrl, title } }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      <FastImage
        style={styles.img}
        source={imageUrl ? { uri: imageUrl } : imagePlaceholder}
        resizeMode={FastImage.resizeMode.cover}
        onLoad={() => setImageLoaded(true)}>
        <View style={styles.imageOverlayContainer}>
          {!!title && (
            <Text
              allowFontScaling={false}
              style={[
                styles.noteTitle,
                {
                  color: imageUrl ? 'white' : 'black',
                  fontWeight: imageUrl ? 'bold' : 'normal',
                },
              ]}>
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
    // alignItems: 'center',
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
  const { cachedState: { notes } = {} } = state;

  return {
    notes: notes ?? [],
  };
};

export default connect(mapStateToProps)(BoardsScreen);
