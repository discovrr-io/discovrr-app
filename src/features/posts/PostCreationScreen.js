import React, { Component } from 'react';

import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Keyboard,
  NativeEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

import { connect } from 'react-redux';
import { getVersion } from 'react-native-device-info';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Portal, TextInput } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import Geolocation from 'react-native-geolocation-service';
import ImagePicker from 'react-native-image-crop-picker';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import ProgressCircle from 'react-native-progress/Circle';
import RNPopoverMenu from 'react-native-popover-menu';
import storage from '@react-native-firebase/storage';

import { isAndroid, windowWidth } from '../../utilities/Constants';
import { requestPermissionConfig } from '../../utilities/Permissions';
import { updateNotes } from '../../utilities/Actions';
import ModalActivityIndicatorAlt from '../../components/ModalActivityIndicatorAlt';

const Parse = require('parse/react-native');
const isEqual = require('lodash/isEqual');

const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

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

class PostCreationScreen extends Component {
  constructor(props) {
    super(props);

    ({
      isEditing: this.isEditing = false,
      postData: this.postData,
      dispatch: this.dispatch,
      navigation: { goBack: this.goBack, navigate: this.navigate },
    } = props);

    let images;
    if (props.isEditing && props.postData) {
      ({
        postData: { title: this.title, location: this.location },
        editPostAfterAction: this.editPostAfterAction,
      } = props);

      if (
        Array.isArray(props.postData.images) &&
        props.postData.images.length
      ) {
        // images = props.postData.images.map((imageData) => ({ ...imageData, isExistingMedia: true }));

        images = [];
        this.originalImages = [];

        props.postData.images.forEach((imageData) => {
          images.push({ ...imageData, isExistingMedia: true });
          this.originalImages.push({ ...imageData, isExistingMedia: true });
        });

        // this.originalImages = { ...images };
      }

      if (isDevMode) {
        this.location = {
          text: 'Jinja, Uganda',
          coordinates: {
            latitude: 0.4478565999999999,
            longitude: 33.2026122,
          },
        };
      }
    }

    debugAppLogger({
      props,
    });

    this.bottomSheetEmitter = new NativeEventEmitter('showPanel');
    this.snackbarEmitter = new NativeEventEmitter('showSnackbar');
    this.updateEmitter = new NativeEventEmitter('refreshPosts');

    this.maxMedia = 6;

    this.state = {
      images,
      locationKey: 1,
      visibility: true,
      isProcessing: false,
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

    this.fetchData();
  }

  componentWillUnmount() {
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
            const results = await query.find();

            if (Array.isArray(results) && results.length) {
              const notes = results.map((note) => {
                const imageData = note.get('image');
                const imageUrl = imageData?.url ?? null;
                const source = imageUrl ? { uri: imageUrl } : imagePlaceholder;
                const width = windowWidth / 2;
                const title = note.get('title');
                const noteData = {
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

              if (Array.isArray(notes) && notes.length)
                this.dispatch(updateNotes(notes));

              debugAppLogger({
                info: 'PostCreationScreen fetchData',
                notes,
              });
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
            info: 'onFinish PostCreationScreen',
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

  updateInputValue =
    (input) =>
    (value = '') => {
      // debugAppLogger({
      //   info: 'ProfileEditScreen updateInputValue',
      //   input,
      //   value,
      // });

      const { [`${input}Error`]: errorValue } = this.state;

      this[input] = value.trim();

      if (errorValue) {
        this.setState({
          [`${input}Error`]: false,
        });
      }
    };

  getLocationPermission = () => {
    requestPermissionConfig({
      request: 'location',
      showReason: false,
      grantedAction: this.useDeviceLocation,
      deniedAction: () => {
        const { locationKey } = this.state;

        if (this.preferredLocation) {
          this.preferredLocation.description = '';
        } else {
          this.preferredLocation = { description: '' };
        }

        this.snackbarEmitter.emit('showSnackbar', {
          message: 'Location permission denied',
        });

        this.setState({
          locationKey: locationKey + 1,
        });
      },
    });
  };

  useDeviceLocation = () => {
    Geolocation.getCurrentPosition(
      (position = {}) => {
        debugAppLogger(position);
        // alert(JSON.stringify(position), null, 2);
        // return;
        this.gotLocation = true;
        const { coords: { latitude: lat, longitude: lng } = {} } = position;

        this.setPostLocation(
          {
            description: 'My Current Location',
          },
          {
            geometry: {
              location: {
                lat,
                lng,
              },
            },
          },
          true,
        );

        const { locationError } = this.state;

        if (locationError) this.setState({ locationError: false });
      },
      (error) => {
        debugAppLogger({
          info: 'useDeviceLocation - BottomSheetPanel',
          errorMsg: error.message,
          error,
        });
        // alert(error.message);

        const { locationKey } = this.state;

        if (this.preferredLocation) {
          this.preferredLocation.description = '';
        } else {
          this.preferredLocation = { description: '' };
        }

        this.snackbarEmitter.emit('showSnackbar', {
          message: 'Location permission denied',
        });

        this.setState({
          locationKey: locationKey + 1,
        });
        // log(error.code, error.message);
        // this.mapref.fitToElements(true);
      },
      {
        // enableHighAccuracy: true,
        // showLocationDialog: false,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  setPostLocation = (data, details, alreadyHaveDeviceLocation = false) => {
    try {
      debugAppLogger({ info: '>> Google places', data, details });

      if (
        data.description === 'My Current Location' &&
        !alreadyHaveDeviceLocation
      ) {
        this.getLocationPermission();
      } else if (details && details.geometry && details.geometry.location) {
        this.location = {
          text: data.description,
          coordinates: {
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          },
        };

        debugAppLogger({ info: '>> Google places', location: this.location });
      }
    } catch (error) {
      debugAppLogger({ info: '>> Google places Error', error });
    }
  };

  checkLocationError = (location) => {
    debugAppLogger({
      info: 'gotta check location error',
      location,
    });

    this.location = location;

    if (location) {
      const { locationError } = this.state;

      if (locationError) this.setState({ locationError: false });
    }
  };

  toggleSwitch = (selector) => () => {
    this.setState(({ [`${selector}`]: value }) => ({
      [`${selector}`]: !value,
    }));
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

    // if (isDevMode) {
    //   menus = [
    //     {
    //       label: 'Photo',
    //       menus: [
    //         {
    //           label: 'Camera',
    //           icon: cameraIcon,
    //         },
    //         {
    //           label: 'Photo Library',
    //           icon: photosIcon,
    //         },
    //       ],
    //     },
    //     {
    //       label: 'Video',
    //       menus: [
    //         {
    //           label: 'Camera',
    //           icon: videoCamIcon,
    //         },
    //         {
    //           label: 'Video Library',
    //           icon: videosIcon,
    //         },
    //       ],
    //     },
    //   ];
    // }

    RNPopoverMenu.Show(this.addMediaRef, {
      menus,
      tintColor: '#FAFAFA',
      textColor: '#000000',
      title: 'Select from',
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

        const { images: currentImages } = this.state;

        let hasAlreadySelectedImages = false;
        let numberOfSelectedImages = 0;
        if (Array.isArray(currentImages) && currentImages.length) {
          hasAlreadySelectedImages = true;
          numberOfSelectedImages = currentImages.length;
        }

        ImagePicker[pickerMethod]({
          mediaType,
          forceJpg: true,
          multiple: true,
          maxFiles: this.maxMedia - numberOfSelectedImages,
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
              info: 'attach media - PostCreationScreen',
              media,
            });
            // alert(JSON.stringify(media, null, 2));
            if (Array.isArray(media) && media.length) {
              let images = [];

              if (
                isAndroid &&
                media.length + numberOfSelectedImages > this.maxMedia
              ) {
                for (
                  let x = 0;
                  x < this.maxMedia - numberOfSelectedImages;
                  x++
                ) {
                  const { size, path, mime, width, height } = media[x];
                  images.push({ size, path, mime, width, height });
                }

                ToastAndroid.show(
                  `A max of ${this.maxMedia} media may be selected`,
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

              if (hasAlreadySelectedImages)
                images = currentImages.concat(images);

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

  removeMedia = (imageIndex) => () => {
    const { images } = this.state;

    if (Array.isArray(images) && images.length) {
      images.splice(imageIndex, 1);

      debugAppLogger({
        info: 'removeMedia',
        images,
      });

      this.setState({
        images,
      });
    }
  };

  createPost = async () => {
    try {
      const { noteData, images } = this.state;

      let isBagus = true;

      if (!this.title || !this.title.trim()) {
        isBagus = false;
        this.flashErrorIndicator('titleError');
      }

      if (!this.isEditing && !this.location) {
        isBagus = false;
        this.flashErrorIndicator('locationError');
      }

      // if (!noteData) {
      //   isBagus = false;
      //   this.flashErrorIndicator('noteError');
      // }

      if (isBagus) {
        Keyboard.dismiss();

        let hasChanges = !this.isEditing;
        if (this.isEditing) {
          if (this.title !== this.postData.title) hasChanges = true;

          if (!isEqual(images, this.originalImages)) hasChanges = true;

          // if (Array.isArray(images) && images.length) {
          //   if (Array.isArray(this.postData.images) && this.postData.images.length) {
          //     if (images.length === this.postData.images.length) {
          //       hasChanges = images.some((imageObject, index) => {
          //         debugAppLogger({
          //           info: 'Comparing image objects',
          //           index,
          //         });
          //
          //         let isEqual = true;
          //         Object.keys(imageObject).forEach((key) => {
          //           if (imageObject[key] !== this.postData.images[index][key]) isEqual = false;
          //         });
          //
          //         return isEqual;
          //       });
          //     } else {
          //       hasChanges = true;
          //     }
          //   } else {
          //     hasChanges = true;
          //   }
          // } else if (Array.isArray(this.postData.images) && this.postData.images.length) {
          //   hasChanges = true;
          // }
        }

        if (!hasChanges) {
          this.editPostAfterAction();

          this.snackbarEmitter.emit('showSnackbar', {
            message: 'No changes were made',
          });

          return;
        }

        this.toggleActivityIndicator();

        const Post = Parse.Object.extend('Post');
        const post = new Post();

        if (this.isEditing) {
          post.id = this.postData.id;
          post.set('caption', this.title.trim());
        } else {
          post.set('caption', this.title.trim());
          post.set('tags', this.tags || '');
          post.set('location', this.location);
          post.set('boardIdDelete', noteData?.id ?? '');

          if (isDevMode) post.set('status', 9);

          if (noteData && noteData.id) {
            const Board = Parse.Object.extend('Board');
            const boardPointer = new Board();
            boardPointer.id = noteData.id;

            post.set('board', boardPointer);
          }

          if (this.location?.coordinates?.latitude) {
            const {
              coordinates: { latitude, longitude },
            } = this.location;

            const geoPoint = new Parse.GeoPoint(latitude, longitude);
            post.set('geoPoint', geoPoint);
          }
        }

        if (Array.isArray(images) && images.length) {
          // const uploadTasks = [];
          //
          // images.forEach((image, index) => {
          //   if (!image.isExistingMedia) {
          //     const filename = `post/${image.enjaga || 'enjaga'}_${Math.random().toString(36).substring(2)}.${image.type === 'image' ? 'jpg' : '.mp4'}`;
          //     images[index].filename = filename;
          //
          //     const uploadUri = isAndroid ? image.path : image.path.replace('file://', '');
          //
          //     const task = storage()
          //       .ref(filename)
          //       .putFile(uploadUri);
          //
          //     task.on('state_changed', (taskSnapshot) => {
          //       const uploadProgress = Math.round((taskSnapshot.bytesTransferred * 100) / taskSnapshot.totalBytes);
          //       debugAppLogger({
          //         info: `image-${index} -> ${taskSnapshot.bytesTransferred} transferred out of ${taskSnapshot.totalBytes}`,
          //         uploadProgress,
          //       });
          //
          //       this.setState(({ uploadProgresses: tempProgresses = [] }) => {
          //         const uploadProgresses = tempProgresses;
          //         uploadProgresses[index] = uploadProgress;
          //
          //         return { uploadProgresses };
          //       });
          //     });
          //
          //     uploadTasks.push(
          //       task
          //         .then(() => {
          //           this.setState(({ uploadProgresses: tempProgresses = [] }) => {
          //             const uploadProgresses = tempProgresses;
          //             uploadProgresses[index] = 101;
          //
          //             return { uploadProgresses };
          //           });
          //
          //           return storage()
          //             .ref(filename)
          //             .getDownloadURL()
          //             .catch(() => {});
          //         }),
          //     );
          //   }
          // });

          const uploadTasks = images.map((image, index) => {
            if (image.isExistingMedia) return null;

            const filename = `post/${image.enjaga || 'enjaga'}_${Math.random()
              .toString(36)
              .substring(2)}.${image.type === 'image' ? 'jpg' : '.mp4'}`;
            images[index].filename = filename;

            const uploadUri = isAndroid
              ? image.path
              : image.path.replace('file://', '');

            const task = storage().ref(filename).putFile(uploadUri);

            task.on('state_changed', (taskSnapshot) => {
              const uploadProgress = Math.round(
                (taskSnapshot.bytesTransferred * 100) / taskSnapshot.totalBytes,
              );
              debugAppLogger({
                info: `image-${index} -> ${taskSnapshot.bytesTransferred} transferred out of ${taskSnapshot.totalBytes}`,
                uploadProgress,
              });

              this.setState(({ uploadProgresses: tempProgresses = [] }) => {
                const uploadProgresses = tempProgresses;
                uploadProgresses[index] = uploadProgress;

                return { uploadProgresses };
              });
            });

            return task.then(() => {
              this.setState(({ uploadProgresses: tempProgresses = [] }) => {
                const uploadProgresses = tempProgresses;
                uploadProgresses[index] = 101;

                return { uploadProgresses };
              });

              return storage()
                .ref(filename)
                .getDownloadURL()
                .catch(() => {});
            });
          });

          this.setState({ isUploading: true });

          const urls = await Promise.all(uploadTasks).then((values) => values);

          images.forEach((image, index) => {
            if (!image.isExistingMedia) image.url = urls[index];
          });

          debugAppLogger({
            info: 'createPost firebase storage',
            urls,
            images,
          });

          post.set('media', images);
        } else {
          post.set('media', []);
        }

        const results = await post.save();

        this.toggleActivityIndicator();

        if (this.isEditing) {
          this.editPostAfterAction({ title: this.title, images });
        } else {
          this.goBack();
        }

        this.updateEmitter.emit('refreshPosts');

        this.snackbarEmitter.emit('showSnackbar', {
          message: `Post successfully ${this.isEditing ? 'updated' : 'shared'}`,
        });

        debugAppLogger({
          info: 'Post creation',
          results,
        });
      }
    } catch (error) {
      debugAppLogger({
        info: 'createPost firebase storage',
        errorMsg: error.message,
        error,
      });

      this.toggleActivityIndicator();

      this.setState({
        isUploading: false,
      });
    }
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
        info: 'flashErrorIndicator PostCreationScreen',
        errorMsg: e.message,
        error: e,
      });
      //
    }
  };

  refreshData = () => {
    debugAppLogger({
      info: 'Gonna attempt to refresh - PostCreationScreen',
      isRefreshingData,
    });

    this.fetchData();
  };

  render() {
    const {
      locationKey,
      visibility,
      noteData,
      titleError,
      locationError,
      images,
      isProcessing,
      noteError,
      isUploading,
      uploadProgresses,
      animatedHeight,
    } = this.state;

    debugAppLogger({
      info: 'PostCreationScreen',
      uploadProgresses,
    });

    return (
      <View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled" indicatorStyle="black">
          {/* <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 20 }}>
            <Text style={{ marginRight: 10 }}>
              {visibility ? 'Public' : 'Private'}
            </Text>
            <Switch
              color="#00D8C6"
              value={visibility}
              onValueChange={this.toggleSwitch('visibility')}
            />
          </View> */}

          <View
            style={{
              marginTop: 20,
              marginBottom: 10,
            }}>
            <TouchableOpacity
              activeOpacity={0.8}
              ref={this.refSelector('addMediaRef')}
              onPress={this.showImageAttachmentOptions}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Text style={{ marginHorizontal: 10 }}>Media</Text>
                <MaterialCommunityIcon
                  name="camera-plus"
                  size={24}
                  color="black"
                />
              </View>
            </TouchableOpacity>

            {!!(Array.isArray(images) && images.length) && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginTop: 10,
                }}>
                {images.map(({ path, isExistingMedia }, index) => (
                  <FastImage
                    key={path}
                    style={{
                      width: windowWidth * 0.28,
                      height: windowWidth * 0.28,
                      margin: 3,
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    resizeMethod="resize"
                    resizeMode="cover"
                    source={{ uri: path }}>
                    {!isExistingMedia &&
                      !!isUploading &&
                      appVersion !== '0.0.3' &&
                      Array.isArray(uploadProgresses) &&
                      uploadProgresses[index] !== 101 && (
                        <ProgressCircle
                          // useNativeDriver
                          // indeterminate
                          showsText
                          allowFontScaling={false}
                          size={60}
                          thickness={2}
                          color="white"
                          borderColor="#666666"
                          progress={
                            (Array.isArray(uploadProgresses) &&
                              uploadProgresses[index]) ||
                            0
                          }
                          style={{
                            borderRadius: 30,
                            backgroundColor: 'rgba(0, 0, 0 , 0.6)',
                          }}
                        />
                      )}

                    {(isExistingMedia ||
                      (Array.isArray(uploadProgresses) &&
                        uploadProgresses[index] === 101)) && (
                      <View style={styles.removePhotoButton}>
                        <MaterialIcon
                          name="check-circle"
                          size={22}
                          color="black"
                        />
                      </View>
                    )}

                    {!isUploading && (
                      <TouchableOpacity
                        activeOpacity={0.6}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        onPress={this.removeMedia(index)}
                        style={styles.removePhotoButton}>
                        <MaterialIcon name="cancel" size={22} color="black" />
                      </TouchableOpacity>
                    )}
                  </FastImage>
                ))}
              </View>
            )}
          </View>

          <View>
            <TextInput
              multiline
              ref={this.refSelector('captionRef')}
              label="Caption*"
              placeholder="Write a caption or post a link"
              defaultValue={this.title}
              underlineColor="black"
              theme={{
                colors: {
                  primary: '#666666',
                },
              }}
              style={{
                backgroundColor: 'white',
              }}
              error={titleError}
              onChangeText={this.updateInputValue('title')}
            />

            {titleError && (
              <Animatable.View
                animation="flash"
                ref={this.refSelector('titleError')}
                style={styles.errorCircle}
              />
            )}
          </View>

          {!this.isEditing && (
            <View
              style={{
                marginTop: 10,
              }}>
              <GooglePlacesAutocomplete
                key={locationKey}
                ref={this.refSelector('autoCompleteRef')}
                autoFillOnNotFound
                fetchDetails
                enablePoweredByContainer={false}
                // placeholder="Location"
                minLength={0}
                onPress={this.setPostLocation}
                anchor="top"
                predefinedPlaces={[currentLocation]}
                query={{
                  key: 'AIzaSyAqZGkR0XP10HNHhFFvUiwHSxgq5W9s1iE',
                  language: 'en',
                }}
                // textInputProps={{
                //   selectTextOnFocus: isAndroid,
                //   selectionColor: 'black',
                // }}
                textInputProps={{
                  label: 'Location*',
                  // placeholder: '...',
                  theme: {
                    colors: {
                      primary: '#666666',
                    },
                  },
                  style: {
                    backgroundColor: 'white',
                    width: '100%',
                  },
                  error: locationError,
                  InputComp: TextInput,
                }}
                checkLocationError={this.checkLocationError}
              />

              {locationError && (
                <Animatable.View
                  animation="flash"
                  ref={this.refSelector('locationError')}
                  style={styles.errorCircle}
                />
              )}
            </View>
          )}

          {/* <View
            style={{
              marginTop: 10,
            }}
          >
            <TextInput
              ref={this.refSelector('captionRef')}
              autoCorrect={false}
              autoCapitalize="none"
              label="Tags"
              placeholder=""
              underlineColor="black"
              theme={{
                colors: {
                  primary: '#666666',
                },
              }}
              style={{
                backgroundColor: 'white',
              }}
              // error={titleError}
              onChangeText={this.updateInputValue('tags')}
            />

            {titleError && (
              <Animatable.View
                animation="flash"
                ref={this.refSelector('titleError')}
                style={styles.errorCircle}
              />
            )}
          </View> */}

          {!this.isEditing && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                marginTop: 30,
                alignSelf: 'flex-start',
              }}
              onPress={this.showBottomSheet}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                }}>
                <Text
                  style={{
                    marginRight: 5,
                    color: 'black',
                  }}>
                  Upload to{noteData?.id ? ' feed:' : ' feed'}
                </Text>

                {noteError && (
                  <Animatable.View
                    animation="flash"
                    ref={this.refSelector('noteError')}
                    style={[styles.errorCircle, { bottom: '65%', top: '35%' }]}
                  />
                )}

                {!!(noteData && noteData.id) && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginHorizontal: 10,
                    }}>
                    <FastImage
                      style={{
                        width: 40,
                        height: 40,
                      }}
                      source={noteData.source}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                    <Text
                      numberOfLines={2}
                      style={{
                        marginLeft: 7,
                        color: '#555555',
                        fontStyle: 'italic',
                        maxWidth: windowWidth * 0.45,
                      }}>
                      {noteData.title}
                    </Text>
                  </View>
                )}

                <MaterialCommunityIcon
                  name="chevron-down"
                  size={24}
                  color="black"
                />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isProcessing}
            onPress={this.createPost}
            style={styles.submitButton}>
            {isProcessing ? (
              <View
                style={{
                  // flex: 1,
                  // backgroundColor: 'orange',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 18,
                    color: 'white',
                    marginRight: 7,
                  }}>
                  {this.isEditing ? 'Update' : 'Share'}
                </Text>

                <ActivityIndicator
                  animating
                  color="white"
                  size="small"
                  style={{
                    // transform: [{ scale: 1.5 }]
                    marginLeft: 4,
                    paddingVertical: 2,
                  }}
                />
              </View>
            ) : (
              <View
                style={{
                  // flex: 1,
                  // backgroundColor: 'orange',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 18,
                    color: 'white',
                    marginRight: 7,
                  }}>
                  {this.isEditing ? 'Update' : 'Share'}
                </Text>

                <MaterialCommunityIcon
                  name="chevron-right"
                  size={24}
                  color="white"
                />
              </View>
            )}
          </TouchableOpacity>

          <Animated.View style={{ height: animatedHeight }} />
        </ScrollView>

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
    paddingHorizontal: 20,
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
  const { cachedState: { notes } = {} } = state;

  return {
    items: notes ?? [],
  };
};

export default connect(mapStateToProps)(PostCreationScreen);
