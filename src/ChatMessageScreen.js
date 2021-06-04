import React, { Component } from 'react';

import {
  Animated,
  NativeEventEmitter,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native';

import { GiftedChat } from 'react-native-gifted-chat';
import RNPopoverMenu from 'react-native-popover-menu';
import ImagePicker from 'react-native-image-crop-picker';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { connect } from 'react-redux';
import { Portal } from 'react-native-paper';
import { getVersion } from 'react-native-device-info';
import ModalActivityIndicatorAlt from './components/ModalActivityIndicatorAlt';
import { isAndroid } from './utilities/Constants';
import { updateNotes } from './utilities/Actions';

const Parse = require('parse/react-native');

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const cameraIcon = <MaterialIcon name="camera-alt" color="#000000" size={24} />;
const photosIcon = (
  <MaterialIcon name="collections" color="#000000" size={24} />
);
const videoCamIcon = <MaterialIcon name="videocam" color="#000000" size={24} />;
const videosIcon = <MaterialIcon name="movie" color="#000000" size={24} />;

const appVersion = getVersion();
const isDevMode = process.env.NODE_ENV === 'development';

const currentLocation = {
  description: 'My Current Location',
  geometry: { location: { lat: 48.8496818, lng: 2.2940881 } },
};

class ChatMessageScreen extends Component {
  constructor(props) {
    super(props);

    ({
      dispatch: this.dispatch,
      navigation: { goBack: this.goBack, navigate: this.navigate },
      route: {
        params: { chatPartner: this.chatPartner },
      },
    } = props);

    debugAppLogger({
      props,
    });

    this.bottomSheetEmitter = new NativeEventEmitter('showPanel');
    this.snackbarEmitter = new NativeEventEmitter('showSnackbar');
    this.updateEmitter = new NativeEventEmitter('refreshPosts');

    this.maxMedia = 6;

    this.state = {
      locationKey: 1,
      visibility: true,
      isProcessing: false,
      animatedHeight: new Animated.Value(0),
      user: {
        _id: props.userDetails.profileId,
        profileId: props.userDetails.profileId,
        name: props.userDetails.name,
        surname: props.userDetails.surname,
        avatar: props.userDetails.avatar?.url ?? undefined,
      },
      messages: [
        {
          _id: 2,
          text: "As much as DMs are disabled, I am the best listener there is. \
             Don't believe me? Type away and see!",
          createdAt: new Date(),
          user: {
            _id: this.chatPartner.profileId,
            name: this.chatPartner.name,
            avatar: this.chatPartner.avatar?.url ?? undefined,
          },
        },
        {
          _id: 1,
          text: 'Direct messaging currently disabled',
          createdAt: new Date(),
          system: true,
        },
      ],
    };
  }

  componentDidMount() {
    // if (isAndroid) {
    //   this.subscriptions = [
    //     Keyboard.addListener('keyboardDidShow', this.keyboardWillShow),
    //     Keyboard.addListener('keyboardDidHide', this.keyboardWillHide),
    //     BackHandler.addEventListener('hardwareBackPress', this.handleBackPress),
    //   ];
    // } else {
    //   this.subscriptions = [
    //     Keyboard.addListener('keyboardWillShow', this.keyboardWillShow),
    //     Keyboard.addListener('keyboardWillHide', this.keyboardWillHide),
    //   ];
    // }
    // this.fetchData();
  }

  componentWillUnmount() {
    // this.subscriptions.forEach((sub) => sub.remove());
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

  showBottomSheet = () => {
    try {
      const { items } = this.props;

      this.captionRef.blur();

      this.bottomSheetEmitter.emit('showPanel', {
        extraData: {
          notes: items,
        },
        contentSelector: 'selectNote',
        onFinish: (data) => {
          debugAppLogger({
            info: 'onFinish ChatMessageScreen',
            data,
          });

          this.setState({
            noteData: data,
            noteError: false,
          });
        },
      });
    } catch (e) {
      //
    }
  };

  showImageAttachmentOptions = () => {
    let menus = [
      {
        menus: [
          {
            label: 'Camera',
            // icon: cameraIcon,
          },
          {
            label: 'Photos',
            // icon: photosIcon,
          },
        ],
      },
    ];

    if (isDevMode) {
      menus = [
        {
          label: 'Photo',
          menus: [
            {
              label: 'Camera',
              // icon: cameraIcon,
            },
            {
              label: 'Photo Library',
              // icon: photosIcon,
            },
          ],
        },
        {
          label: 'Video',
          menus: [
            {
              label: 'Camera',
              // icon: videoCamIcon,
            },
            {
              label: 'Video Library',
              // icon: videosIcon,
            },
          ],
        },
      ];
    }
    RNPopoverMenu.Show(this.addMediaRef, {
      menus,
      tintColor: '#FAFAFA',
      title: 'Select from',
      // menus: [{
      //   menus: [
      //     {
      //       label: 'Camera',
      //       icon: cameraIcon,
      //     },
      //     {
      //       label: 'Photos',
      //       icon: photosIcon,
      //     },
      //   ],
      // }],
      onDone: (section, menuIndex) => {
        let mediaType = 'photo';
        let pickerMethod = 'openCamera';

        if (isAndroid) {
          if (section === 1) mediaType = 'video';

          if (menuIndex === 1) pickerMethod = 'openPicker';
        } else {
          if (section === 2 || section === 3) mediaType = 'video';

          if (section === 1 || section === 3) pickerMethod = 'openPicker';
        }
        // const selection = isAndroid ? menuIndex : section;
        // alert(`section - ${section} <-> menduIndex - ${menuIndex}`);

        // return;
        // ImagePicker[selection ? 'openPicker' : 'openCamera']({
        ImagePicker[pickerMethod]({
          mediaType,
          forceJpg: true,
          multiple: true,
          maxFiles: this.maxMedia,
          // mediaType: 'photo',
          compressImageMaxWidth: 800,
          compressImageMaxHeight: 800,
          compressImageQuality: isAndroid && mediaType === 'video' ? 1 : 0.8,
          // cropping: true,
          cropperToolbarTitle: 'Edit Profile Photo',
          cropperActiveWidgetColor: '#00D8C6',
          cropperStatusBarColor: '#000000',
        })
          .then((media) => {
            debugAppLogger({
              info: 'attach media - ChatMessageScreen',
              media,
            });
            // alert(JSON.stringify(media, null, 2));
            if (Array.isArray(media) && media.length) {
              let images = [];
              if (isAndroid && media.length > this.maxMedia) {
                for (let x = 0; x < this.maxMedia; x++) {
                  const { size, path, mime, width, height } = media[x];
                  images.push({ size, path, mime, width, height });
                }

                ToastAndroid.show(
                  `A max of ${this.maxMedia} may be selected`,
                  ToastAndroid.LONG,
                );
              } else {
                images = media.map((image) => {
                  const { size, path, mime, width, height } = image;

                  return {
                    size,
                    path,
                    mime,
                    width,
                    height,
                    type: mediaType === 'photo' ? 'image' : 'video',
                  };
                });
              }

              this.setState({ images });
            }
          })
          .catch((error) => {
            if (error.code !== 'E_PICKER_CANCELLED') {
              debugAppLogger({
                info: 'ProfileEditScreen showImageAttachmentOptions ImagePicker Error',
                errorMessage: error.message,
                error,
              });
            }
          });
      },
      onCancel: () => {},
    });
  };

  toggleActivityIndicator = () => {
    this.setState(({ isProcessing }) => ({
      isProcessing: !isProcessing,
    }));
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
        info: 'flashErrorIndicator ChatMessageScreen',
        errorMsg: e.message,
        error: e,
      });
    }
  };

  sendMessage = (message) => {
    const { messages } = this.state;

    const updateMessages = [...message, ...messages];

    this.setState({
      messages: updateMessages,
    });

    debugAppLogger({
      info: 'sendMessage - ChatMessageScreen',
      message,
    });
  };

  render() {
    const { isProcessing, uploadProgresses, messages, user } = this.state;

    debugAppLogger({
      info: 'ChatMessageScreen',
      uploadProgresses,
    });

    return (
      <View style={styles.container}>
        <GiftedChat
          showUserAvatar
          alwaysShowSend
          renderUsernameOnMessage
          messages={messages}
          user={user}
          placeholder="Message..."
          onSend={this.sendMessage}
        />

        {isProcessing && (
          <Portal>
            <ModalActivityIndicatorAlt hideIndicator opacity={0.1} />
          </Portal>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: 20,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: 'white',
  },
  removePhotoButton: {
    // alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    // backgroundColor: 'white',
    borderRadius: 20,
    // borderWidth: 1,
    justifyContent: 'center',
    // width: 30,
    // height: 30,
    // borderColor: 'black',
    position: 'absolute',
    top: 5,
    right: 7,
  },
  submitButton: {
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
    marginBottom: 50,
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
    bottom: 17,
    right: 1,
  },
});

const mapStateToProps = (state) => {
  const { userState: { userDetails } = {} } = state;

  return {
    userDetails,
  };
};

export default connect(mapStateToProps)(ChatMessageScreen);
