import React, {
  Component,
  useState,
} from 'react';

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

import {
  connect,
} from 'react-redux';

import {
  Placeholder,
  PlaceholderMedia,
  Fade,
} from 'rn-placeholder';

import {
  isAndroid,
  windowWidth,
  windowHeight,
} from './utilities/Constants';

import {
  updateNotes,
} from './utilities/Actions';

import {
  fetchNotes,
} from './utilities/NetworkRequests';

const Parse = require('parse/react-native');

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');

const vpWidth = (windowWidth * 0.5) - 15;

class BoardsScreen extends Component {
  constructor(props) {
    super(props);

    ({
      dispatch: this.dispatch,
      navigation: {
        navigate: this.navigate,
      },
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
    if (isAndroid) BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);

    DeviceEventEmitter.addListener('refreshNotes', this.refreshData);

    // fetchNotes();
    this.fetchData();
  }

  componentWillUnmount() {
    if (isAndroid) BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);

    DeviceEventEmitter.removeListener('refreshNotes', this.refreshData);
  }

  refSelector = (selector) => (compRef) => { this[selector] = compRef; }

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
              // const images = [
              //   {
              //     imageUrl: 'https://www.headshotsprague.com/wp-content/uploads/2019/08/Emotional-headshot-of-aspiring-actress-on-white-background-made-by-Headshots-Prague-1.jpg',
              //     height: 1709,
              //     width: 2560,
              //   },
              //   {
              //     imageUrl: 'https://nadiazheng.com/wp-content/uploads/2015/12/Montreal-personal-branding-linkedin-profile-professional-headshot-by-nadia-zheng-800x1000.jpg',
              //     height: 1000,
              //     width: 800,
              //   },
              //   {
              //     imageUrl: 'https://43laq7hfw6b26gd6y23qp1cq-wpengine.netdna-ssl.com/wp-content/uploads/2017/10/Ben-Marcum-Photography-Headshot-Photographer-Louisville-Kentucky-Actor-Headshots-Evvie-Johnson-Sep-04-2017-137-1024x819.jpg',
              //     height: 819,
              //     width: 1024,
              //   },
              // ];
              const notes = results.map((note) => {
                const imageData = note.get('image');
                const imageUrl = imageData?.url ?? null;
                const source = imageUrl ? { uri: imageUrl } : imagePlaceholder;
                const width = (windowWidth / 2);
                const title = note.get('title');
                const noteData = {
                  width,
                  imageData,
                  imageUrl,
                  source,
                  title,
                  // uri: imageUrl,
                  // uri: images[index] ? images[index].imageUrl : 'https://nadiazheng.com/wp-content/uploads/2015/12/Montreal-personal-branding-linkedin-profile-professional-headshot-by-nadia-zheng-800x1000.jpg',
                  // key: note.id,
                  key: `${imageUrl || imagePlaceholder}${title}`,
                  id: note.id,
                  isPrivate: note.get('private'),
                  noteOwnerProfileId: note.get('profile').id,
                  height: width * ((imageUrl ? imageData.height : 600) / (imageUrl ? imageData.width : 800)),
                };

                noteData.dimensions = {
                  height: noteData.height,
                  width: noteData.width,
                };

                return noteData;
              });

              if (Array.isArray(notes) && notes.length) this.dispatch(updateNotes(notes));

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
  }

  showNoteCreationSheet = () => {
    try {
      this.bottomSheetEmitter.emit(
        'showPanel',
        {
          contentSelector: 'createNote',
          onFinish: () => {
            // this.hasEnjagad = false;
            // this.setState({
            //   masonryKey: Date.now(),
            // });
          },
        },
      );
    } catch (e) {
      //
    }
  }

  showNoteDetails = (data, data2) => {
    debugAppLogger({
      info: 'showNoteDetails',
      data,
      data2,
    });

    this.showDetails(data)();
  }

  showDetails = (data) => () => {
    debugAppLogger({
      info: 'BoardsScreen showDetails',
      data,
    });

    this.navigate('NoteDetailScreen', data);
  }

  renderEmptyView = () => (
    <View
      style={{
        flex: 1,
        height: windowHeight * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>
        No notes
      </Text>
    </View>
  )

  refreshData = () => {
    const {
      isRefreshingData,
    } = this.state;

    debugAppLogger({
      info: 'Gonna attempt to refresh - BoardsScreen',
      isRefreshingData,
    });

    if (!isRefreshingData) {
      this.setState({ isRefreshingData: true });

      this.fetchData();
    }
  }

  render() {
    const {
      isRefreshingData,
    } = this.state;

    const {
      notes,
    } = this.props;

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
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}
            onPress={this.showNoteCreationSheet}
          >
            <MaterialIcon name="add" size={32} color="gray" />

            <Text style={{ fontSize: 18, marginLeft: 10 }}>
              Create a note
            </Text>
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
          onPressImage={this.showNoteDetails}
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
        onLoad={() => setImageLoaded(true)}
      >
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
              ]}
            >
              {title}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 7, marginBottom: 7 }} />
        </View>
      </FastImage>

      {!imageLoaded && false && (
        <Placeholder
          Animation={Fade}
        >
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
  const {
    cachedState: {
      notes,
    } = {},
  } = state;

  return {
    notes: notes ?? [],
  };
};

export default connect(mapStateToProps)(BoardsScreen);
