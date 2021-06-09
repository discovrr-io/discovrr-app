import React, { Component, useState, useRef, useEffect } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Keyboard,
  NativeEventEmitter,
  StyleSheet,
  Text,
  TextInput as EnjagaTextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { FlatList, ScrollView } from 'react-native-gesture-handler';

import {
  Caption,
  RadioButton,
  Snackbar,
  Surface,
  Switch,
  TextInput,
} from 'react-native-paper';

import MapView, { Circle } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import {
  AppleButton,
  appleAuth,
} from '@invertase/react-native-apple-authentication';

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';

import { connect } from 'react-redux';
import { getVersion } from 'react-native-device-info';
import * as Animatable from 'react-native-animatable';
import auth from '@react-native-firebase/auth';
import BottomSheet from 'reanimated-bottom-sheet';
import FastImage from 'react-native-fast-image';
import Geolocation from 'react-native-geolocation-service';
import ImagePicker from 'react-native-image-crop-picker';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import messaging from '@react-native-firebase/messaging';
import ProgressCircle from 'react-native-progress/Circle';
import RNPopoverMenu from 'react-native-popover-menu';
import Share from 'react-native-share';
import Slider from '@react-native-community/slider';
import storage from '@react-native-firebase/storage';

import ModalActivityIndicatorAlt from './ModalActivityIndicatorAlt';
import PostCreationScreen from '../PostCreationScreen';
import { requestPermissionConfig } from '../utilities/Permissions';
import { saveLocationPreference } from '../utilities/Actions';
import { showOnMap } from '../utilities/LinkingActions';

import {
  emailRegex,
  isAndroid,
  windowWidth,
  windowHeight,
} from '../utilities/Constants';

const Parse = require('parse/react-native');

const debounce = require('lodash/debounce');

const imagePlaceholder = require('../../resources/images/imagePlaceholder.png');

const cameraIcon = <MaterialIcon name="camera-alt" color="#000000" size={24} />;
const photosIcon = (
  <MaterialIcon name="collections" color="#000000" size={24} />
);

const snapPoints = ['75%', 0];
// const snapPoints = ['70%', '50%', 0];

const appVersion = getVersion();

const currentLocation = {
  description: 'My Current Location',
  geometry: { location: { lat: 48.8496818, lng: 2.2940881 } },
};

class BottomSheetPanel extends Component {
  constructor(props) {
    super(props);

    ({ dispatch: this.dispatch } = props);

    this.debouncedMapRegionChange = debounce(this.updateMapRegion, 500);

    this.updateEmitter = new NativeEventEmitter('refreshItems');

    this.bottomSheetRef = React.createRef();

    let markers;
    let coordinates;
    let searchRadius = 3;
    let hasCoordinates = false;
    if (props.locationPreference) {
      hasCoordinates = true;
      this.preferredLocation = props.locationPreference.location;
      coordinates = {
        latitude: props.locationPreference.latitude,
        longitude: props.locationPreference.longitude,
      };
      searchRadius = props.locationPreference.searchRadius || 3;
      this.initialRegion = { ...props.locationPreference };
      this.region = {
        ...props.locationPreference,
        searchRadius,
      };

      markers = [
        {
          id: 'you',
          name: 'You',
          color: 'linen',
          coordinate: { ...coordinates },
        },
      ];
    } else {
      this.initialRegion = {
        latitude: -33.88013879489698,
        longitude: 151.1145074106,
        latitudeDelta: 1.2327156923275737,
        longitudeDelta: 1.20815712958743,
      };
    }

    this.shareOptions = {
      title: 'Discovrr Share',
      subject: 'Discovrr Share',
    };

    this.values = {
      login: {},
      register: {},
      forgot: {},
    };

    this.state = {
      coordinates,
      hasCoordinates,
      markers,
      searchRadius,
      locationKey: 1,
      isProcessing: false,
      isFetchingData: false,
      noteVisibility: true,
      isBottomSheetOpen: false,
      backdropOpacity: new Animated.Value(0),
      contentSelector: null,
      showSnackbar: false,
      snackbarMessage: '',
    };

    debugAppLogger({
      info: 'BottomSheetPanel constructor',
    });
  }

  componentDidMount() {
    if (isAndroid)
      BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);

    DeviceEventEmitter.addListener('showPanel', this.showBottomSheet);
    DeviceEventEmitter.addListener('showSnackbar', this.showSnackbarMessage);

    // this.notifPermissionRequest = setTimeout(() => this.requestNotifPermission(), 10000);
  }

  componentWillUnmount() {
    if (isAndroid)
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackPress,
      );

    DeviceEventEmitter.removeListener('showPanel', this.showBottomSheet);
    DeviceEventEmitter.removeListener('showSnackbar', this.showSnackbarMessage);
  }

  refSelector = (selector) => (compRef) => {
    this[selector] = compRef;
  };

  handleBackPress = () => {
    try {
      const { isBottomSheetOpen } = this.state;

      if (isBottomSheetOpen) {
        Keyboard.dismiss();

        this.bottomSheetRef.current.snapTo(snapPoints.length - 1);

        setTimeout(() => {
          this.setState({
            contentSelector: null,
            extraData: null,
            isBottomSheetOpen: false,
            imageUri: null,
            imageDetails: null,
            titleError: false,
          });
        }, 50);

        return true;
      }
    } catch (e) {
      //
    }

    return false;
  };

  requestNotifPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const permissionAuthorized =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      debugAppLogger({
        info: 'requestNotifPermission - BottomSheetPanel',
        authStatus,
      });

      let notifAuthStatus;
      if (!isAndroid) {
        switch (authStatus) {
          case messaging.AuthorizationStatus.AUTHORIZED:
            notifAuthStatus = 'Authorized';
            break;
          case messaging.AuthorizationStatus.DENIED:
            notifAuthStatus = 'Denied';
            break;
          case messaging.AuthorizationStatus.PROVISIONAL:
            notifAuthStatus = 'Provisional';
            break;
          case messaging.AuthorizationStatus.NOT_DETERMINED:
            notifAuthStatus = 'Indeterminate';
            break;
          default:
          //
        }
      }

      const { userDetails } = this.props;

      if (!isAndroid && userDetails.notifAuthStatus !== notifAuthStatus) {
        const User = Parse.Object.extend('User');
        const query = new Parse.Query(Parse.Object.extend('Profile'));
        query.equalTo('owner', new User({ id: userDetails.id }));

        const results = await query.first();

        if (results && results.id) {
          if (permissionAuthorized) {
            const notifToken = await messaging()
              .getToken()
              .then((token) => {
                debugAppLogger({
                  info: 'getToken - BottomSheetPanel',
                  token,
                });

                return token;
              })
              .catch(() => null);

            results.set('notifToken', notifToken);

            debugAppLogger({
              info: 'requestNotifPermission - BottomSheetPanel',
              notifToken,
            });
          }

          results.set('notifAuthStatus', notifAuthStatus);
          results.set('platform', isAndroid ? 'Android' : 'iOS');

          results.save();
        }

        debugAppLogger({
          info: 'requestNotifPermission - BottomSheetPanel',
          results,
        });
      } else {
        debugAppLogger({
          info: 'requestNotifPermission - BottomSheetPanel',
          details: 'notifAuthStatus is same same so skiped synching',
        });
      }
    } catch (error) {
      debugAppLogger({
        info: 'Error - requestNotifPermission - BottomSheetPanel',
        errorMsg: error.message,
        error,
      });
      //
    }
  };

  dismissSnackbar = () => {
    this.setState({
      showSnackbar: false,
      snackbarMessage: '',
    });
  };

  showMessage = (snackbarMessage) => () => {
    if (snackbarMessage) {
      this.setState({
        snackbarMessage,
        showSnackbar: true,
      });
    }
  };

  showSnackbarMessage = (data) => {
    debugAppLogger({
      info: 'showSnackbarMessage',
      data,
    });

    try {
      const message = data?.message ?? null;
      if (message) {
        this.setState({
          showSnackbar: true,
          snackbarMessage: message,
        });
      }
    } catch (e) {
      // alert(e.message);
    }
  };

  showBottomSheet = (data) => {
    debugAppLogger({
      info: 'showBottomSheet',
      data,
    });

    try {
      const { backdropOpacity } = this.state;

      let pointOfInterest;
      let extraData = data?.extraData ?? null;
      const contentSelector = data?.contentSelector ?? null;

      if (contentSelector === 'pinPostToNote') {
        const { notes } = this.props;

        if (!extraData) {
          extraData = { notes };
        } else {
          extraData.notes = notes;
        }

        if (!Array.isArray(notes) || !notes.length) {
          this.setState({ isFetchingData: true });
          this.fetchData('notes');
        }
      } else if (contentSelector === 'showOnMap') {
        pointOfInterest = this.calculateRegion(
          extraData.location.coordinates.latitude,
          extraData.location.coordinates.longitude,
          700,
        );
      }

      this.setState({
        extraData,
        contentSelector,
        pointOfInterest,
        isBottomSheetOpen: true,
        noteVisibility: !data?.extraData?.isPrivate ?? true,
        showSnackbar: false,
        inputMode: 'login',
      });

      this.bottomSheetRef.current.snapTo(0);

      Animated.timing(backdropOpacity, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (contentSelector === 'editNote' && extraData)
        this.title = extraData.title;

      if (data && typeof data.onFinish === 'function')
        this.finishedAction = data.onFinish;
    } catch (e) {
      // alert(e.message);
      //
    }
  };

  hideBottomSheetPanel = () => {
    try {
      const { backdropOpacity } = this.state;

      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();

      Keyboard.dismiss();

      this.bottomSheetRef.current.snapTo(snapPoints.length - 1);

      setTimeout(() => {
        this.setState({
          contentSelector: null,
          extraData: null,
          isBottomSheetOpen: false,
          imageUri: null,
          imageDetails: null,
          noteVisibility: true,
          titleError: false,
          previousMode: null,
          previousModeTitle: '',
          isFetchingData: false,
          selectedRadioButton: null,
          emailError: false,
          passwordError: false,
        });
      }, 50);

      this.afterAction = null;
      this.finishedAction = null;
      this.title = '';

      this.values = {
        login: {},
        register: {},
        forgot: {},
      };
    } catch (e) {
      //
    }
  };

  editPostAfterAction = ({ title, images } = {}) => {
    try {
      if (title || images) this.finishedAction({ title, images });

      this.hideBottomSheetPanel();
    } catch (e) {
      // TODO
    }
  };

  fetchData = async (selector) => {
    try {
      debugAppLogger({
        info: `fetchData ${selector} - BottomSheetPanel`,
        selector,
      });

      const { userDetails } = this.props;

      let query;

      const User = Parse.Object.extend('User');

      switch (selector) {
        case 'notes':
          query = new Parse.Query(Parse.Object.extend('Board'));
          query.equalTo('owner', new User({ id: userDetails.id }));
          break;
        default:
        //
      }

      const results = await query.find();

      if (Array.isArray(results) && results.length) {
        if (selector === 'notes') {
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

          if (Array.isArray(notes) && notes.length) {
            this.setState(({ extraData }) => {
              if (!extraData) {
                return { extraData: { notes } };
              }

              extraData.notes = notes;
              return { extraData };
            });
          }

          debugAppLogger({
            info: 'fetchData notes - BottomSheetPanel',
            notes,
          });
        }
      }

      this.setState({ isFetchingData: false });
    } catch (error) {
      this.setState({ isFetchingData: false });
    }
  };

  showImageAttachmentOptions = () => {
    RNPopoverMenu.Show(this.attachmentButtonRef, {
      tintColor: '#FAFAFA',
      textColor: '#000000',
      title: 'Select from',
      menus: [
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
      ],
      onDone: (section, menuIndex) => {
        const selection = isAndroid ? menuIndex : section;
        ImagePicker[selection ? 'openPicker' : 'openCamera']({
          forceJpg: true,
          mediaType: 'photo',
          compressImageMaxWidth: 800,
          compressImageMaxHeight: 800,
          compressImageQuality: 0.8,
          // cropping: true,
          cropperToolbarTitle: 'Edit Profile Photo',
          cropperActiveWidgetColor: '#00D8C6',
          cropperStatusBarColor: '#000000',
        })
          .then(({ size, path, mime, width, height }) => {
            debugAppLogger({
              info: 'Attached image details',
              size,
              path,
              mime,
              width,
              height,
            });

            this.setState(
              {
                imageUri: path,
                imageDetails: {
                  size,
                  path,
                  mime,
                  width,
                  height,
                  type: 'image',
                },
              },
              () => {
                // this.syncProfileChanges('avatar');
              },
            );
          })
          .catch((error) => {
            debugAppLogger({
              info: 'ProfileEditScreen showImageAttachmentOptions ImagePicker Error',
              errorMessage: error.message,
              error,
            });
          });
      },
      onCancel: () => {},
    });
  };

  openSystemShare = () => {
    try {
      this.hideBottomSheetPanel();

      const { extraData } = this.state;

      let message = 'Discovrr Share';
      if (extraData) {
        if (extraData.title)
          message = `Check out ${extraData.title} on Discovrr`;

        if (extraData.id)
          message = `${message}\n\nhttps://discovrrio.com/p/${extraData.id}`;
      }

      const shareOptions = {
        message,
        title: 'Discovrr Share',
        // url: `file://${imagePath}`,
        // type: 'image/jpeg',
        subject: 'Discovrr Share',
      };

      Share.open(shareOptions)
        .then((results) => {
          // alert(JSON.stringify(results, null, 2));
        })
        .catch((error) => {
          // alert(error.message);
        });
    } catch (e) {
      //
    }
  };

  singleShare = (selector) => async () => {
    try {
      this.hideBottomSheetPanel();

      const { extraData } = this.state;

      let message = 'Discovrr Share';
      if (extraData) {
        if (extraData.title)
          message = `Check out ${extraData.title} on Discovrr`;

        if (extraData.id)
          message = `${message}\n\nhttps://discovrrio.com/p/${extraData.id}`;
      }

      let social;
      switch (selector) {
        case 'whatsapp':
          social = Share.Social.WHATSAPP;
          break;
        case 'facebook':
          social = Share.Social.FACEBOOK;
          break;
        case 'instagram':
          social = Share.Social.INSTAGRAM;
          break;
        case 'twitter':
          social = Share.Social.TWITTER;
          break;
        default:
          this.openSystemShare();
          return;
      }

      const shareOptions = {
        title: 'Discovrr Share',
        message,
        // url: 'some share url',
        social,
      };

      Share.shareSingle(shareOptions).catch((error) => {
        // alert(JSON.stringify(error));
        this.openSystemShare();
      });
    } catch (error) {
      // alert(error.message);
    }
  };

  updateInputValue =
    (input) =>
    (value = '') => {
      debugAppLogger({
        info: `updateInputValue ${input} - BottomSheetPanels`,
        input,
        value,
      });

      this[input] = value.trim();
      this.setState({
        [`${input}Error`]: false,
      });
    };

  authUpdateInputValue = (input) => (value) => {
    const { inputMode } = this.state;

    this.values[inputMode][input] = value.trim();
    this.setState({
      [`${input}Error`]: false,
    });
  };

  toggleActivityIndicator = () => {
    this.setState(({ isProcessing }) => ({
      isProcessing: !isProcessing,
    }));
  };

  toggleSwitch = (selector) => () => {
    this.setState(({ [`${selector}`]: value }) => ({
      [`${selector}`]: !value,
    }));
  };

  resetLocationFilter = () => {
    try {
      this.initialRegion = {
        latitude: -33.88013879489698,
        longitude: 151.1145074106,
        latitudeDelta: 1.2327156923275737,
        longitudeDelta: 1.20815712958743,
      };

      this.region = this.initialRegion;

      this.setState(
        {
          hasCoordinates: false,
          coordinates: null,
          markers: null,
          searchRadius: 3,
        },
        () => {
          this.mapRef.animateToRegion(this.initialRegion);
        },
      );
    } catch (e) {
      //
    }
  };

  applyLocationFilter = () => {
    if (typeof this.finishedAction === 'function') this.finishedAction();

    this.hideBottomSheetPanel();
  };

  changeSearchRadius = (searchRadius) => {
    this.setState(
      {
        searchRadius,
      },
      () => {
        this.debouncedMapRegionChange();
      },
    );
  };

  calculateRegion = (latitude, longitude, distance) => {
    const tempDistance = distance / 2;
    const circumference = 40075;
    const oneDegreeOfLatitudeInMeters = 111.32 * 1000;
    const angularDistance = tempDistance / circumference;

    const latitudeDelta = tempDistance / oneDegreeOfLatitudeInMeters;
    const longitudeDelta = Math.abs(
      Math.atan2(
        Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(longitude) * Math.sin(latitude),
      ),
    );

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  };

  updateLocation = (data) => {
    debugAppLogger({
      info: 'FilteringDrawer updateLocation',
      data,
    });

    if (data.description && data.geometry)
      this.setPreferredLocation(data, data, true);
  };

  setPreferredLocation = (
    data,
    details,
    updateLocationKey = false,
    alreadyHaveDeviceLocation = false,
  ) => {
    try {
      debugAppLogger({ info: '>> Google places', data, details });

      // const enjaga = { data, details };
      // alert(JSON.stringify(enjaga, null, 2));
      // return;

      const { description } = data;

      if (description === 'My Current Location' && !alreadyHaveDeviceLocation) {
        this.getLocationPermission();
      } else {
        const { geometry } = details || {};

        if (description && geometry) {
          const markers = [
            {
              id: 'you',
              name: 'You',
              color: 'linen',
              coordinate: {
                latitude: geometry.location.lat,
                longitude: geometry.location.lng,
              },
            },
          ];

          this.fitMarkerIds = ['job', 'you'];

          if (updateLocationKey) this.preferredLocation = description;

          const { locationKey, searchRadius } = this.state;

          this.setState(
            {
              markers,
              hasCoordinates: true,
              locationKey: updateLocationKey ? locationKey + 1 : locationKey,
              coordinates: {
                latitude: geometry.location.lat,
                longitude: geometry.location.lng,
              },
            },
            () => {
              if (this.mapRef) {
                this.region = this.calculateRegion(
                  geometry.location.lat,
                  geometry.location.lng,
                  searchRadius * 1000 + searchRadius * 2000,
                );

                this.region.searchRadius = searchRadius;
                this.region.location = description;

                this.mapRef.animateToRegion(this.region);

                this.dispatch(saveLocationPreference(this.region));
              }
            },
          );
        }
      }
    } catch (error) {
      debugAppLogger({ info: '>> Google places Error', error });
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

        this.setState({
          locationKey: locationKey + 1,
          snackbarMessage: 'Location permission denied',
          showSnackbar: true,
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

        this.setPreferredLocation(
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
          false,
          true,
        );
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

        this.setState({
          locationKey: locationKey + 1,
          snackbarMessage: 'Location permission denied',
          showSnackbar: true,
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

  updateMapRegion = () => {
    if (this.region) {
      const { searchRadius } = this.state;

      this.region = this.calculateRegion(
        this.region.latitude,
        this.region.longitude,
        searchRadius * 1000 + searchRadius * 2000,
      );

      this.region.searchRadius = searchRadius;
      this.mapRef.animateToRegion(this.region);
      this.dispatch(saveLocationPreference(this.region));
    }
  };

  createNewNote = async () => {
    try {
      const { noteVisibility } = this.state;

      let isBagus = true;

      if (!this.title || !this.title.trim()) {
        isBagus = false;
        this.setState({ titleError: true });
      }

      if (isBagus) {
        Keyboard.dismiss();
        this.toggleActivityIndicator();
        const Note = Parse.Object.extend('Board');
        const note = new Note();
        note.set('title', this.title.trim());
        note.set('private', !noteVisibility);

        const response = await note.save();

        this.updateEmitter.emit('refreshNotes');

        this.toggleActivityIndicator();

        const data = {
          title: this.title.trim(),
          id: response.id,
          key: response.id,
          isPrivate: !noteVisibility,
          imageUrl: null,
          imageData: null,
          source: imagePlaceholder,
        };

        if (typeof this.finishedAction === 'function')
          this.finishedAction(data);

        this.hideBottomSheetPanel();

        debugAppLogger({
          info: 'createNewNote',
          noteData: data,
          response,
        });
      } else {
        // alert('Missing key info la');
      }
    } catch (error) {
      console.log({
        info: '*Error createNewNote - BottomSheetPanel',
        errorCode: error.code,
        errorMsg: error.message,
        error,
      });
      this.toggleActivityIndicator();
    }
  };

  updateNote = async () => {
    try {
      const { noteVisibility, extraData, imageUri, imageDetails } = this.state;

      let isBagus = true;
      let hasChanges = false;

      if (!this.title || !this.title.trim()) {
        isBagus = false;
      } else if (this.title.trim() !== extraData.title) {
        hasChanges = true;
      }

      if (noteVisibility !== !extraData.isPrivate) hasChanges = true;

      if (imageUri && imageDetails) hasChanges = true;

      debugAppLogger({
        info: 'BottomSheetPanel updateNote',
        noteVisibility,
        title: this.title,
        imageUri,
        imageDetails,
        extraData,
        isBagus,
        hasChanges,
      });

      if (isBagus) {
        if (hasChanges) {
          Keyboard.dismiss();
          this.toggleActivityIndicator();

          const query = new Parse.Query(Parse.Object.extend('Board'));
          query.equalTo('objectId', extraData.id);
          const results = await query.find();

          debugAppLogger({
            info: 'updateNote',
            results,
          });

          if (Array.isArray(results) && results.length) {
            const [note] = results;

            let noteCover = null;
            if (imageUri && imageDetails) {
              const filename = `board/${note.id}_${Math.random()
                .toString(36)
                .substring(2)}.jpg`;
              const uploadUri = isAndroid
                ? imageDetails.path
                : imageDetails.path.replace('file://', '');

              const task = storage().ref(filename).putFile(uploadUri);

              this.setState({
                isUploading: true,
              });

              task.on('state_changed', (taskSnapshot) => {
                const uploadProgress = Math.round(
                  (taskSnapshot.bytesTransferred * 100) /
                    taskSnapshot.totalBytes,
                );
                this.setState({ uploadProgress });
                debugAppLogger({
                  info: `${taskSnapshot.bytesTransferred} transferred out of ${taskSnapshot.totalBytes}`,
                  uploadProgress,
                });
              });

              await task;

              const imageUrl = await storage()
                .ref(filename)
                .getDownloadURL()
                .catch(() => {});

              noteCover = {
                ...imageDetails,
                path: filename,
                url: imageUrl,
              };

              note.set('image', noteCover);
            }

            note.set('title', this.title);
            note.set('private', !noteVisibility);

            await note.save();

            if (typeof this.finishedAction === 'function') {
              this.finishedAction({
                isPrivate: !noteVisibility,
                image: noteCover ?? null,
                imageUrl: noteCover?.url ?? null,
                title: this.title,
                // width:
              });
            }

            this.setState(
              {
                // snackbarMessage: 'Successfully updated note details',
                snackbarMessage: 'Note successfully updated',
                showSnackbar: true,
                isUploading: false,
              },
              () => {
                this.updateEmitter.emit('refreshNotes');
              },
            );
          }

          this.toggleActivityIndicator();

          this.hideBottomSheetPanel();
        } else {
          this.hideBottomSheetPanel();

          this.setState({
            snackbarMessage: 'No changes were made',
            showSnackbar: true,
            isProcessing: false,
          });
        }
      }
    } catch (error) {
      debugAppLogger({
        info: 'updateNote Error',
        error,
      });
      this.toggleActivityIndicator();
    }
  };

  renderBackdrop = () => {
    const { backdropOpacity } = this.state;

    return (
      <Animated.View
        style={{
          opacity: backdropOpacity,
          backgroundColor: '#000',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
        <TouchableOpacity
          style={{
            width: windowWidth,
            height: windowHeight,
            backgroundColor: 'transparent',
          }}
          activeOpacity={1}
          onPress={this.hideBottomSheetPanel}
        />
      </Animated.View>
    );
  };

  renderBottomSheetHeader = () => (
    <View style={styles.panelHeader}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.panelHandle}
        onPress={this.openPanel}
      />
    </View>
  );

  renderShareSheet = () => {
    const { extraData } = this.state;

    const marginHorizontal = 7;

    let shareTitle = 'Share';
    if (extraData && extraData.title) shareTitle = `Share ${extraData.title}`;

    return (
      <View style={styles.bottomSheetSurface}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 5,
          }}>
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={{
              fontSize: 16,
              color: '#777777',
            }}>
            {shareTitle}
          </Text>
        </View>

        <View style={styles.divider} />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
          }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              marginHorizontal,
            }}
            onPress={this.singleShare('whatsapp')}>
            <MaterialCommunityIcon name="whatsapp" size={56} color="#25D366" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              marginHorizontal,
            }}
            onPress={this.singleShare('twitter')}>
            <MaterialCommunityIcon name="twitter" size={56} color="#1da1f2" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              marginHorizontal,
            }}
            onPress={this.singleShare('facebook')}>
            <MaterialCommunityIcon name="facebook" size={56} color="#3b5998" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              marginHorizontal,
            }}
            onPress={this.singleShare('instagram')}>
            <MaterialCommunityIcon name="instagram" size={56} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              marginHorizontal,
            }}
            onPress={this.openSystemShare}>
            <MaterialCommunityIcon
              name="dots-horizontal-circle"
              size={56}
              color="#9C9A9A"
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            // flex: 1,
            height: 40,
            // width: '85%',
            flexDirection: 'row',
            // marginRight: 15,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#AAAAAA',
            borderRadius: 30,
            backgroundColor: 'white',
            marginTop: 30,
            maxWidth: windowWidth * 0.9,
          }}>
          <EnjagaTextInput
            allowFontScaling={false}
            autoCorrect={false}
            autoCompleteType="name"
            keyboardType="default"
            placeholder="Search for contacts"
            returnKeyType="done"
            textContentType="name"
            selectionColor="black"
            placeholderTextColor={isAndroid ? undefined : '#BBBBBB'}
            style={{
              flex: 1,
              height: 40,
              paddingLeft: 10,
              marginRight: 10,
            }}
            // onSubmitEditing={focusAction}
            // onChangeText={updateInputValue(selector)}
          />

          <MaterialIcon
            name="search"
            size={28}
            color="#777777"
            // onPress={() => this.toggleDrawer()}
            // onPress={this.postComment}
          />
        </View>

        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 50,
          }}>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 12,
              color: '#888888',
            }}>
            No contacts
          </Text>
        </View>
      </View>
    );
  };

  renderCreateNote = () => {
    const {
      titleError,
      noteVisibility,
      previousMode,
      previousModeTitle,
      isProcessing,
    } = this.state;

    return (
      <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={styles.bottomSheetSurface}>
          {!!previousMode && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                marginBottom: 10,
              }}
              onPress={this.switchToPreviousMode}>
              <MaterialCommunityIcon
                name="chevron-left"
                size={28}
                color="#727272"
              />

              {!!previousModeTitle && (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    color: '#727272',
                  }}>
                  {previousModeTitle}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 20,
            }}>
            <Text style={{ marginRight: 10 }}>
              {noteVisibility ? 'Public' : 'Private'}
            </Text>
            <Switch
              color="#00D8C6"
              value={noteVisibility}
              onValueChange={this.toggleSwitch('noteVisibility')}
            />
          </View>

          <TextInput
            autoFocus
            label="Note title"
            // mode="outlined"
            // value={text}
            underlineColor="black"
            theme={{
              colors: {
                primary: 'black',
              },
            }}
            style={{
              backgroundColor: 'white',
            }}
            error={titleError}
            onChangeText={this.updateInputValue('title')}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isProcessing}
            onPress={this.createNewNote}
            style={styles.actionButton}>
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
                    // fontWeight: '500',
                    color: 'white',
                    marginRight: 7,
                  }}>
                  Create Note
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
                    // fontWeight: '500',
                    color: 'white',
                    marginRight: 7,
                  }}>
                  Create Note
                </Text>

                <MaterialCommunityIcon
                  name="chevron-right"
                  size={24}
                  color="white"
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  renderEditNote = () => {
    const {
      titleError,
      noteVisibility,
      extraData,
      imageUri,
      imageDetails,
      isProcessing,
      isUploading,
      uploadProgress,
    } = this.state;

    const imageWidth = windowWidth / 2;
    let imageHeight = imageWidth * (800 / 600);
    let noteCoverImage = imagePlaceholder;

    if (imageUri || extraData.imageUrl) {
      noteCoverImage = {
        uri: imageUri || extraData.imageUrl,
      };

      const imageData = imageUri ? imageDetails : extraData;
      imageHeight = imageWidth * (imageData.height / imageData.width);
    }

    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        bounces={false}
        contentContainerStyle={{
          paddingBottom: windowHeight * 0.2,
          backgroundColor: 'white',
        }}>
        <View style={styles.bottomSheetSurface}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 12, marginRight: 10 }}>
              {noteVisibility ? 'Public' : 'Private'}
            </Text>
            <Switch
              color="#00D8C6"
              value={noteVisibility}
              onValueChange={this.toggleSwitch('noteVisibility')}
            />
          </View>

          <TextInput
            label="Note title"
            defaultValue={extraData?.title ?? ''}
            // value={text}
            underlineColor="black"
            theme={{
              colors: {
                primary: 'black',
              },
            }}
            style={{
              backgroundColor: 'white',
            }}
            error={titleError}
            onChangeText={this.updateInputValue('title')}
          />

          <View
            style={{
              marginVertical: 20,
              alignItems: 'center',
            }}>
            <FastImage
              style={{
                position: 'relative',
                width: imageWidth,
                height: imageHeight,
                borderRadius: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              // source={extraData.imageUrl ? { uri: extraData.imageUrl } : imagePlaceholder}
              source={noteCoverImage}
              resizeMode={FastImage.resizeMode.cover}
              // onLoad={() => setImageLoaded(true)}
            >
              {!!isUploading && appVersion !== '0.0.3' && (
                <ProgressCircle
                  showsText
                  allowFontScaling={false}
                  size={60}
                  thickness={2}
                  color="white"
                  borderColor="#666666"
                  progress={uploadProgress}
                  style={{
                    // position: 'absolute',
                    // top: '50%',
                    // bottom: '50%',
                    // // left: '50%',
                    // // right: '50%',
                    width: 60,
                    borderRadius: 30,
                    backgroundColor: 'rgba(0, 0, 0 , 0.6)',
                  }}
                />
              )}

              <TouchableWithoutFeedback
                activeOpacity={0.9}
                onPress={this.showImageAttachmentOptions}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 10,
                }}>
                <Surface style={styles.cameraIconSurface}>
                  <MaterialCommunityIcon
                    ref={this.refSelector('attachmentButtonRef')}
                    name="camera-plus"
                    size={20}
                    color="black"
                  />
                </Surface>
              </TouchableWithoutFeedback>
            </FastImage>
          </View>

          {/* <TouchableOpacity
            activeOpacity={0.9}
            onPress={this.updateNote}
            style={styles.submitButton}
          >
            {isProcessing ? (
              <ActivityIndicator
                animating
                color="black"
                size="small"
                // style={{ transform: [{ scale: 1.5 }] }}
              />
            ) : (
              <Text
                allowFontScaling={false}
                style={{ fontSize: 12, color: 'black', textAlign: 'center' }}
              >
                Update Note
              </Text>
            )}
          </TouchableOpacity> */}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isProcessing}
            onPress={this.updateNote}
            style={styles.actionButton}>
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
                    fontSize: 16,
                    // fontWeight: '500',
                    color: 'white',
                    marginRight: 7,
                  }}>
                  Update Note
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
                    fontSize: 16,
                    // fontWeight: '500',
                    color: 'white',
                    marginRight: 7,
                  }}>
                  Update Note
                </Text>

                <MaterialCommunityIcon
                  name="chevron-right"
                  size={24}
                  color="white"
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  renderReportSheet = () => {
    const { extraData, selectedRadioButton, isProcessing } = this.state;

    let shareTitle = 'Report';
    if (extraData && extraData.title) shareTitle = `Report ${extraData.title}`;

    return (
      <View style={styles.bottomSheetSurface}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 5,
          }}>
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={{
              fontSize: 16,
              color: '#777777',
            }}>
            {shareTitle}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text
          allowFontScaling={false}
          style={{
            fontWeight: '600',
            color: '#333333',
          }}>
          Why are you reporting this post?
        </Text>

        <View>
          <RadioButton.Group
            onValueChange={(newValue) =>
              this.setState({ selectedRadioButton: newValue })
            }
            value={selectedRadioButton}>
            <View
            // style={{
            //   flexDirection: 'row',
            //   alignItems: 'center',
            // }}
            >
              {/* <MaterialCommunityIcon
                name="lens-black"
                size={18}
                color="#777777"
                // onPress={() => this.toggleDrawer()}
                // onPress={this.postComment}
              /> */}

              <RadioButton.Item
                label="- It is suspicious, spam, or misleading"
                value="spam"
                style={{
                  // width: '95%',
                  paddingLeft: 10,
                }}
              />
            </View>

            <View>
              <RadioButton.Item
                label="- It is violent or repulsive"
                value="violent"
                style={{
                  // width: '95%',
                  paddingLeft: 10,
                }}
              />
            </View>

            <View>
              <RadioButton.Item
                label="- It is abusive or hateful"
                value="abusive"
                style={{
                  // width: '95%',
                  paddingLeft: 10,
                }}
              />
            </View>

            <View>
              <RadioButton.Item
                label="- It is harmful or dangerous"
                value="harmful"
                size={10}
                style={{
                  // width: '95%',
                  size: 10,
                  paddingLeft: 10,
                }}
              />
            </View>

            <View>
              <RadioButton.Item
                label="- It is sexual content"
                value="sexual"
                style={{
                  // width: '95%',
                  paddingLeft: 10,
                }}
              />
            </View>
          </RadioButton.Group>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isProcessing}
          style={styles.actionButton}
          onPress={async () => {
            this.setState({
              isProcessing: true,
            });

            await new Promise((resolve) => {
              setTimeout(() => {
                this.setState(
                  {
                    isProcessing: false,
                  },
                  () => {
                    resolve('food');
                  },
                );
              }, 1500);
            });

            this.setState(
              {
                isProcessing: false,
                snackbarMessage: 'Successfully reported',
                showSnackbar: true,
              },
              () => {
                this.hideBottomSheetPanel();
              },
            );
          }}>
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
                  // fontWeight: '500',
                  color: 'white',
                  marginRight: 7,
                }}>
                Submit
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
                  // fontWeight: '500',
                  color: 'white',
                  marginRight: 7,
                }}>
                Submit
              </Text>

              <MaterialCommunityIcon
                name="chevron-right"
                size={24}
                color="white"
              />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  switchToPreviousMode = () => {
    this.setState(({ previousMode }) => ({
      previousMode: null,
      previousModeTitle: '',
      contentSelector: previousMode,
    }));
  };

  switchToCreateNote = (selector) => () => {
    // let previousMode;
    //
    // switch (selector) {
    //   case 'pinPostToNote':
    //     previousMode = 'pinPostToNote';
    //     break;
    //   case 'selectNote':
    //     previousMode = 'selectNote';
    //     break;
    //   default:
    //     this.hideBottomSheetPanel();
    //     return;
    // }

    this.setState({
      previousMode: selector,
      contentSelector: 'createNote',
      previousModeTitle: 'Select Note',
    });
  };

  noteKeyExtractor = (item) => item.id;

  noteSeparator = () => (
    <View
      style={{
        height: 15,
      }}
    />
  );

  selectNote = (note) => () => {
    debugAppLogger({
      info: 'selectNote - BottomSheetPanel',
      note,
    });

    if (typeof this.finishedAction === 'function') {
      this.finishedAction(note);
      this.hideBottomSheetPanel();
    }
  };

  renderSelectNoteItem = ({ item }) => (
    <TouchableOpacity
      TouchableOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={this.selectNote(item)}>
      <FastImage
        style={{
          width: 50,
          height: 50,
        }}
        source={item.source}
        resizeMode={FastImage.resizeMode.cover}
      />

      <Text
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          marginLeft: 20,
        }}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  renderSelectNote = () => {
    const {
      // titleError,
      // noteVisibility,
      extraData,
      // imageUri,
      // imageDetails,
      // isProcessing,
      // isUploading,
      // uploadProgress,
    } = this.state;

    const notes =
      (extraData && Array.isArray(extraData.notes) && extraData.notes) || [];

    // const imageWidth = windowWidth / 2;
    // let imageHeight = imageWidth * (800 / 600);
    // let noteCoverImage = imagePlaceholder;
    //
    // if (imageUri || extraData.imageUrl) {
    //   noteCoverImage = {
    //     uri: imageUri || extraData.imageUrl,
    //   };
    //
    //   const imageData = imageUri ? imageDetails : extraData;
    //   imageHeight = imageWidth * (imageData.height / imageData.width);
    // }

    return (
      <View style={styles.bottomSheetSurface}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 5,
          }}>
          <Text
            style={{
              fontSize: 16,
              color: '#777777',
            }}>
            Your Travel Notes
          </Text>
        </View>

        <View style={styles.divider} />

        <View
          style={{
            alignSelf: 'center',
            width: '100%',
            paddingTop: 0,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderColor: '#EEEEEE',
          }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}
            onPress={this.switchToCreateNote('selectNote')}>
            <MaterialIcon name="add" size={32} color="gray" />

            <Text style={{ fontSize: 18, marginLeft: 10 }}>
              Create a new note
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginVertical: 20,
          }}>
          <Text>Upload to an exisitng note</Text>
        </View>

        <FlatList
          data={notes}
          keyExtractor={this.noteKeyExtractor}
          ItemSeparatorComponent={this.noteSeparator}
          renderItem={this.renderSelectNoteItem}
          contentContainerStyle={{
            paddingBottom: 50,
          }}
        />
      </View>
    );
  };

  selectPinPostNote = (note) => async () => {
    try {
      this.setState({
        isProcessing: true,
        hideIndicator: false,
      });

      const { extraData } = this.state;

      debugAppLogger({
        info: 'selectPinPostNote - BottomSheetPanel',
        note,
        extraData,
      });

      const Post = Parse.Object.extend('Post');
      const postPointer = new Post();
      postPointer.id = extraData.postData.id;

      const Board = Parse.Object.extend('Board');
      const boardPointer = new Board();
      boardPointer.id = note.id;

      const pinnedRelation = boardPointer.relation('pinnedEnjaga');
      pinnedRelation.add(postPointer);

      boardPointer.addUnique('pinnedEnjagaArray', extraData.postData.id);

      await boardPointer.save();

      if (typeof this.finishedAction === 'function') {
        this.finishedAction(extraData.postData, true);
        this.hideBottomSheetPanel();
      }

      this.setState({
        isProcessing: false,
        hideIndicator: true,
      });
    } catch (error) {
      this.setState({
        isProcessing: false,
        hideIndicator: true,
      });
      //
    }
  };

  renderPinPostItem = ({ item }) => (
    <TouchableOpacity
      TouchableOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={this.selectPinPostNote(item)}>
      <FastImage
        style={{
          width: 50,
          height: 50,
        }}
        source={item.source}
        resizeMode={FastImage.resizeMode.cover}
      />

      <Text
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          marginLeft: 20,
        }}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  renderPinPost = () => {
    const { extraData } = this.state;

    const notes =
      (extraData && Array.isArray(extraData.notes) && extraData.notes) || [];

    return (
      <View style={styles.bottomSheetSurface}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 5,
          }}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{
              fontSize: 14,
              color: '#777777',
            }}>
            {`Pin ${extraData.postData.author.name}'s post`}
          </Text>
        </View>

        <View style={styles.divider} />

        <View
          style={{
            alignSelf: 'center',
            width: '100%',
            paddingTop: 0,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderColor: '#EEEEEE',
          }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}
            onPress={this.switchToCreateNote('pinPostToNote')}>
            <MaterialIcon name="add" size={32} color="gray" />

            <Text style={{ fontSize: 18, marginLeft: 10 }}>
              Create a new note
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginVertical: 20,
          }}>
          <Text>Pin to an existing note</Text>
        </View>

        <FlatList
          data={notes}
          keyExtractor={this.noteKeyExtractor}
          ItemSeparatorComponent={this.noteSeparator}
          renderItem={this.renderPinPostItem}
          ListEmptyComponent={this.renderNoNotes}
          contentContainerStyle={{
            paddingBottom: 50,
          }}
        />
      </View>
    );
  };

  renderEditPost = () => {
    const { extraData } = this.state;

    const { navigation } = this.props;

    return (
      <View style={[styles.bottomSheetSurface, { paddingHorizontal: 0 }]}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 5,
          }}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontSize: 14,
              color: '#777777',
            }}>
            {`Edit ${extraData.title}`}
          </Text>
        </View>

        <View style={styles.divider} />

        <PostCreationScreen
          isEditing
          navigation={navigation}
          postData={extraData}
          editPostAfterAction={this.editPostAfterAction}
        />
      </View>
    );
  };

  renderNoNotes = () => {
    const { isFetchingData } = this.state;

    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 30,
        }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 12,
            color: '#888888',
          }}>
          No existing notes
        </Text>

        {isFetchingData && (
          <ActivityIndicator
            animating
            color="gray"
            size="small"
            style={{
              transform: [{ scale: 1.5 }],
              marginTop: 20,
            }}
          />
        )}
      </View>
    );
  };

  renderLocationFilter = () => {
    const { markers, hasCoordinates, coordinates, searchRadius, locationKey } =
      this.state;

    return (
      <View
        style={{
          height: '100%',
          alignItems: 'center',
          backgroundColor: 'white',
        }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 5,
          }}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontSize: 14,
              color: '#777777',
            }}>
            Set search location
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.mapContainer}>
          <MapView
            ref={this.refSelector('mapRef')}
            style={styles.map}
            showsCompass
            loadingEnabled
            loadingIndicatorColor="#099EA3"
            loadingBackgroundColor="white"
            initialRegion={this.initialRegion}
            // onMapReady={this.mapHasLoaded}
            // onDoublePress={this.mapPressed}
            // onPress={this.mapPressed}
            // onRegionChangeComplete={this.regionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}>
            {hasCoordinates &&
              markers.map(({ id, coordinate, name, color }) => (
                <MapView.Marker
                  key={name}
                  identifier={id}
                  pinColor={color}
                  coordinate={coordinate}
                  title={name}
                  // onPress={this.markerPressed}
                />
              ))}

            {hasCoordinates && (
              <Circle
                center={coordinates}
                radius={searchRadius * 1000}
                strokeColor="#099EA3"
                fillColor="rgba(0, 216, 198, 0.1)"
              />
            )}
          </MapView>

          <LocationSearch
            key={locationKey}
            preferredLocation={this.preferredLocation}
            setPreferredLocation={this.setPreferredLocation}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
            width: windowWidth * 0.9,
          }}>
          <Caption style={[styles.caption, { color: '#099EA3' }]}>
            Search radius
          </Caption>

          <Caption
            style={[styles.caption, { color: '#099EA3', fontWeight: 'bold' }]}>
            {searchRadius}km
          </Caption>
        </View>

        <Slider
          style={{
            width: windowWidth * 0.8,
            height: 40,
          }}
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={searchRadius}
          minimumTrackTintColor="#00D8C6"
          maximumTrackTintColor="#000000"
          thumbTintColor="#00D8C6"
          onValueChange={this.changeSearchRadius}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.resetFilterButton}
            onPress={this.resetLocationFilter}>
            <Text
              allowFontScaling={false}
              style={{ fontSize: 12, color: '#727272', textAlign: 'center' }}>
              Reset Filters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.applyFilterButton}
            onPress={this.applyLocationFilter}>
            <Text
              allowFontScaling={false}
              style={{ fontSize: 12, color: 'white', textAlign: 'center' }}>
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  regionChangeComplete = (data) => {
    debugAppLogger({
      info: 'onRegionChangeComplete - BottomSheetPanel',
      data,
    });
  };

  renderShowOnMap = () => {
    const {
      markers,
      hasCoordinates,
      coordinates,
      searchRadius,
      locationKey,
      extraData,
      pointOfInterest,
    } = this.state;

    return (
      <View
        style={{
          height: '100%',
          alignItems: 'center',
          backgroundColor: 'white',
        }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 5,
            marginBottom: 5,
          }}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontSize: 14,
              color: '#444444',
            }}>
            {extraData.name || 'Location'}
          </Text>
        </View>

        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={{
            fontSize: 12,
            color: '#777777',
            textAlign: 'center',
          }}>
          {extraData.location.text}
        </Text>

        <View style={styles.divider} />

        <View style={styles.mapContainer}>
          <MapView
            ref={this.refSelector('mapRef')}
            style={[styles.map, { height: windowHeight * 0.5 }]}
            showsCompass
            loadingEnabled
            loadingIndicatorColor="#099EA3"
            loadingBackgroundColor="white"
            initialRegion={pointOfInterest}
            // onMapReady={this.mapHasLoaded}
            // onDoublePress={this.mapPressed}
            // onPress={this.mapPressed}
            // onRegionChangeComplete={this.regionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}>
            <MapView.Marker
              // identifier={id}
              // pinColor={color}
              coordinate={pointOfInterest}
              title={extraData.name}
              // onPress={this.markerPressed}
            />
          </MapView>
        </View>

        <View style={[styles.buttonContainer, { marginTop: 10 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.resetFilterButton}
            onPress={this.hideBottomSheetPanel}>
            <Text
              allowFontScaling={false}
              style={{ fontSize: 12, color: '#727272', textAlign: 'center' }}>
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.applyFilterButton,
              {
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
            onPress={this.showInMappingApp}>
            <MaterialIcon name="directions" size={20} color="white" />

            <Text
              allowFontScaling={false}
              style={{
                fontSize: 12,
                color: 'white',
                textAlign: 'center',
                marginLeft: 5,
              }}>
              Directions
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  showInMappingApp = () => {
    const {
      extraData: {
        name,
        location: {
          coordinates: { latitude, longitude },
        },
      },
    } = this.state;
    const address = `${latitude},${longitude}`;

    showOnMap(address, '', name);
  };

  performAction = (action) => () => {
    this.setState({
      inputMode: action,
      emailError: false,
      passwordError: false,
    });

    if (action === 'login' || action === 'register' || action === 'forgot') {
      Object.values(this.values).forEach((value) => {
        Object.keys(value).forEach((key) => {
          value[key] = '';
        });
      });
    }
  };

  focusField = (selector) => () => {
    try {
      this.ignoreKeyboardHiding = true;
      this[selector].focus();

      this.ignoreKeyboardHidingTimeout = setTimeout(() => {
        this.ignoreKeyboardHiding = false;
      }, 200);
    } catch (e) {
      this.ignoreKeyboardHiding = false;
      //
    }
  };

  flashErrorIndicator = (errorType) => {
    try {
      const { [errorType]: errorValue } = this.state;

      if (errorValue) {
        this[errorType].flash(1000).then(() => {});
      } else {
        this.setState({ [errorType]: true });
      }
    } catch (error) {
      console.log({
        info: 'Error flashErrorIndicator - BottomSheetPanel',
        errorMsg: error.message,
        error,
      });
      //
    }
  };

  notifyUser = ({ title, message, actions }) => {
    Alert.alert(
      title,
      message,
      (Array.isArray(actions) && actions.length && actions) || [{ text: 'OK' }],
    );
  };

  signInWithApple = async () => {
    try {
      const { isProcessing, isAuthenticating } = this.state;

      if (isProcessing || isAuthenticating) return;

      this.setState({
        isAuthenticating: true,
      });

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      debugAppLogger({
        info: 'signInWithApple - LoginScreen',
        appleAuthRequestResponse,
      });

      if (!appleAuthRequestResponse.identityToken) {
        // throw 'Apple Sign-In failed - no identify token returned';

        this.notifyUser({
          title: 'Authentication Failed',
          message: 'Apple sign-in failed, plrease try agian later',
          action: undefined,
        });

        return;
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;

      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      debugAppLogger({
        info: 'signInWithApple - LoginScreen',
        identityToken,
        nonce,
        appleCredential,
      });

      // Sign the user in with the credential
      await auth().signInWithCredential(appleCredential);

      this.setState({
        isAuthenticating: false,
      });

      // // get current authentication state for user
      // // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
      // const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

      //
      // // use credentialState response to ensure the user is authenticated
      // if (credentialState === appleAuth.State.AUTHORIZED) {
      //   // user is authenticated
      // }
    } catch (error) {
      this.setState({
        isAuthenticating: false,
      });

      console.log({
        info: 'Error - signInWithApple - LoginScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  signInWithGoogle = async () => {
    try {
      const { isProcessing, isAuthenticating } = this.state;

      if (isProcessing || isAuthenticating) return;

      this.setState({
        isAuthenticating: true,
      });

      let idToken;
      let accessToken;

      ({ idToken } = await GoogleSignin.signIn());

      if (isAndroid) {
        ({ idToken, accessToken } = await GoogleSignin.getTokens());
      }

      // const {
      //   idToken,
      // } = await GoogleSignin.signIn();

      // const enjaga = await GoogleSignin.getTokens();
      // alert(JSON.stringify(enjaga, null, 2)); return;

      const googleCredential = auth.GoogleAuthProvider.credential(
        idToken,
        accessToken,
      );

      debugAppLogger({
        info: 'signInWithGoogle - LoginScreen',
        idToken,
        googleCredential,
      });

      await auth().linkWithCredential(googleCredential);

      this.setState({
        isAuthenticating: false,
      });
    } catch (error) {
      this.setState({
        isAuthenticating: false,
      });

      console.log({
        info: 'Error - signInWithGoogle - LoginScreen',
        errorMsg: error.message,
        error,
      });

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'user cancelled the login flow',
        });
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'operation (e.g. sign in) is in progress already',
        });
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'play services not available or outdated',
        });
      } else {
        // some other error happened
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'some other error happened',
        });
      }
    }
  };

  loginUser =
    (overrideLinking = false) =>
    async () => {
      debugAppLogger({ info: 'gonna login' });
      try {
        const { email = '', password = '' } = this.values.login;

        let isBagus = true;

        if (!emailRegex.test(email)) {
          isBagus = false;
          this.flashErrorIndicator('emailError');
        }

        if (!password) {
          isBagus = false;
          this.flashErrorIndicator('passwordError');
        }

        if (isBagus) {
          this.setState({ isProcessing: true });

          if (overrideLinking) {
            Alert.alert(
              'Enjaga Navigate',
              'Looks like we should instead try logging in the donkey without linking',
              [
                {
                  text: 'Cancel',
                },
                {
                  text: 'Simulate Success',
                  onPress: () => {
                    if (typeof this.finishedAction === 'function')
                      this.finishedAction();
                    this.hideBottomSheetPanel();
                  },
                },
              ],
            );
            this.setState({ isProcessing: false });
          } else {
            const { currentUser } = auth();

            const emailCredentials = auth.EmailAuthProvider.credential(
              email,
              password,
            );

            debugAppLogger({
              info: 'loginUser - BottomSheetPanel',
              currentUser,
              emailCredentials,
            });

            currentUser
              .linkWithCredential(emailCredentials)
              .then(() => {
                debugAppLogger({
                  info: 'loginUser firebase - BottomSheetPanel',
                  extraInfo: 'User account successfully linkWithCredential',
                });

                this.setState({ isProcessing: false });
              })
              .catch((error) => {
                this.setState({ isProcessing: false });

                console.log({
                  info: 'Error loginUser and linkWithCredential firebase - BottomSheetPanel',
                  errorMsg: error.message,
                  errorCode: error.code,
                  error,
                });

                let message;
                let showErrorMessage = true;
                switch (error.code) {
                  case 'auth/email-already-in-use':
                    showErrorMessage = false;
                    this.loginUser(true)();
                    break;
                  case 'auth/invalid-email':
                    message = `Email address, ${email}, is invalid!`;
                    break;
                  default:
                    // message = 'Registration failed, please try again later';
                    message = error.message;
                }

                if (showErrorMessage)
                  this.notifyUser({
                    title: 'Action Failed',
                    message,
                    action: undefined,
                  });
              });
          }
        }
      } catch (error) {
        console.log({
          info: 'Error - Login User - BottomSheetPanel',
          errorMsg: error.message,
          errorCode: error.code,
          error,
        });

        const { code } = error;

        let { message, title } = error;

        if (code === 100) {
          title = 'Connection Failed';
          message = 'Please check your internet connection and try again.';
        }

        if (message) this.notifyUser({ title, message, action: undefined });
        this.setState({ isProcessing: false });
      }
    };

  registerUser = async () => {
    debugAppLogger({ info: 'Gonna register' });
    try {
      const { email, password } = this.values.register;

      let isBagus = true;

      if (!emailRegex.test(email)) {
        isBagus = false;
        this.flashErrorIndicator('emailError');
      }

      if (!password) {
        isBagus = false;
        this.flashErrorIndicator('passwordError');
      }

      if (isBagus) {
        this.toggleActivityIndicator(true);

        auth()
          .createUserWithEmailAndPassword(email, password)
          .then(() => {
            debugAppLogger({
              info: 'registerUser firebase - LoginScreen',
              extraInfo: 'User account created & signed in!',
            });

            this.toggleActivityIndicator();
          })
          .catch((error) => {
            this.toggleActivityIndicator();

            console.log({
              info: 'Error registerUser firebase - LoginScreen',
              errorMsg: error.message,
              error,
            });

            let message;
            switch (error.code) {
              case 'auth/email-already-in-use':
                // message = `Email address, ${email}, is already in use!`;
                message = `${email} is already in use!`;
                break;
              case 'auth/invalid-email':
                message = `Email address, ${email}, is invalid!`;
                break;
              default:
                // message = 'Registration failed, please try again later';
                message = error.message;
            }

            this.notifyUser({ title: '', message, action: undefined });
          });
      }
    } catch (error) {
      debugAppLogger({ info: 'Register User', error: JSON.stringify(error) });
      const { code } = error;

      let { message, title } = error;

      if (code === 100) {
        title = 'Connection Failed';
        message = 'Please check your internet connection and try again.';
      }

      if (message) this.notifyUser({ title, message, action: undefined });

      this.toggleActivityIndicator();
    }
  };

  resetPassword = async () => {
    try {
      debugAppLogger({
        info: 'resetPassword - BottomSheetPanel',
        values: this.values,
      });

      const { email = '' } = this.values.forgot;

      if (emailRegex.test(email)) {
        this.toggleActivityIndicator(true);
        Keyboard.dismiss();

        await auth()
          .sendPasswordResetEmail(email, null)
          .then(() => {
            this.notifyUser({
              title: 'Password Reset Email Sent',
              message:
                "We've sent you an email with instructions on how to reset your password.",
              actions: [
                {
                  text: 'OK',
                  onPress: () => this.performAction('login')(),
                },
              ],
            });
          })
          .catch((error) => {
            console.error('Firebase reset email error:', error);

            let message = error.message;
            switch (error.code) {
              case 'auth/user-not-found':
                message =
                  "We don't have an account registered to the email address you gave. Did you type it in correctly?";
                break;
            }

            this.notifyUser({
              title: 'Password Reset Failed',
              message: message,
              action: undefined,
            });
          });

        this.toggleActivityIndicator(false);
      } else {
        this.flashErrorIndicator('emailError');
      }
    } catch (error) {
      console.log({
        info: 'Error resetPassword firebase - BottomSheetPanel',
        errorMsg: error.message,
        errorCode: error.code,
        error,
      });

      this.toggleActivityIndicator(false);
    }
  };

  renderUserAuthentication = () => {
    const {
      extraData,
      isProcessing,
      inputMode = 'login',
      passwordError,
      emailError,
    } = this.state;

    const {
      insets: { top: topInset, bottom: bottomInset },
    } = this.props;

    const activityColor = isProcessing ? '#AAAAAA' : 'black';

    let authComponents = null;
    if (inputMode === 'login') {
      authComponents = (
        <View
          style={{
            flex: 1,
            // paddingBottom: windowWidth * 0.8 * 0.271,
            // paddingBottom: bottomInset + 10,
            paddingBottom: bottomInset + windowHeight * 0.1,
            // justifyContent: 'center',
            // backgroundColor: 'orange',
          }}>
          <View
            style={{
              flex: 1,
              // justifyContent: 'center',
            }}>
            <NavButton
              isProcessing={isProcessing}
              inputMode={inputMode}
              iconName="arrow-forward-ios"
              iconSize={18}
              iconColor="#000000"
              action={this.performAction('register')}
            />

            <InputField
              key={`email-${inputMode}`}
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="email"
              keyboardType="email-address"
              // placeholder="john@gmail.com"
              placeholder="Email"
              returnKeyType="next"
              textContentType="emailAddress"
              focusAction={this.focusField('password')}
              updateInputValue={this.authUpdateInputValue}
              error={emailError}
              selector="email"
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <InputField
              key={`password-${inputMode}`}
              secureTextEntry
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="password"
              keyboardType="default"
              placeholder="Password"
              returnKeyType="done"
              textContentType="password"
              focusAction={this.loginUser(false)}
              updateInputValue={this.authUpdateInputValue}
              error={passwordError}
              selector="password"
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <View style={styles.buttonLikeContainer}>
              <Text
                disabled={isProcessing}
                allowFontScaling={false}
                style={{
                  textDecorationLine: 'underline',
                  fontSize: 14,
                  paddingHorizontal: 5,
                  paddingBottom: 7,
                  color: false ? 'white' : activityColor,
                }}
                onPress={this.performAction('forgot')}>
                Forgot password?
              </Text>

              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14,
                  paddingHorizontal: 5,
                  paddingBottom: 7,
                }}
                // onPress={this.performAction('forgot')}
              >
                {' '}
              </Text>
            </View>

            <AuthActionButton
              isProcessing={isProcessing}
              label="Log in"
              backgroundColor="#0076CE"
              action={this.loginUser(false)}
            />
          </View>

          <View
            style={{
              flex: 0,
              flexDirection: 'column',
              justifyContent: 'center',
              // marginTop: windowHeight * 0.1,
              alignItems: 'center',
            }}>
            <View
              style={{
                flex: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                // marginTop: windowHeight * 0.1,
                alignItems: 'center',
              }}>
              {!isAndroid && (
                <AppleButton
                  // disabled={isProcessing || isAuthenticating}
                  buttonStyle={AppleButton.Style.BLACK}
                  buttonType={AppleButton.Type.SIGN_IN}
                  style={{
                    width: 160, // You must specify a width
                    height: 42, // You must specify a height
                    marginHorizontal: 5,
                  }}
                  onPress={this.signInWithApple}
                />
              )}

              <GoogleSigninButton
                // disabled={isProcessing || isAuthenticating}
                style={{
                  width: 192,
                  height: 48,
                  marginHorizontal: 5,
                  borderRadius: 5,
                }}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Light}
                onPress={this.signInWithGoogle}
              />
            </View>
          </View>
        </View>
      );
    } else if (inputMode === 'register') {
      authComponents = (
        <View
          style={{
            flex: 1,
            // paddingBottom: windowWidth * 0.8 * 0.271,
            paddingBottom: bottomInset + windowHeight * 0.1,
            // justifyContent: 'center',
          }}>
          <View
            style={{
              flex: 1,
              // justifyContent: 'center',
            }}>
            <NavButton
              isProcessing={isProcessing}
              iconName="arrow-back-ios"
              iconSize={18}
              iconColor="#000000"
              action={this.performAction('login')}
            />

            <InputField
              key={`email-${inputMode}`}
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="email"
              keyboardType="email-address"
              placeholder="*Email"
              returnKeyType="next"
              textContentType="emailAddress"
              focusAction={this.focusField('password')}
              updateInputValue={this.authUpdateInputValue}
              error={emailError}
              selector="email"
              // extraStyles={{ marginVertical: 7 }}
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <InputField
              key={`password-${inputMode}`}
              secureTextEntry
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="password"
              keyboardType="default"
              placeholder="*Password"
              returnKeyType="done"
              textContentType="password"
              focusAction={this.registerUser}
              updateInputValue={this.authUpdateInputValue}
              error={passwordError}
              selector="password"
              // extraStyles={{ marginVertical: 7 }}
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <AuthActionButton
              isProcessing={isProcessing}
              label="Sign up"
              backgroundColor="#00D8C6"
              action={this.registerUser}
            />
          </View>

          <View
            style={{
              flex: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              // marginTop: windowHeight * 0.1,
              alignItems: 'center',
            }}>
            {!isAndroid && (
              <AppleButton
                // disabled={isProcessing || isAuthenticating}
                buttonStyle={AppleButton.Style.BLACK}
                buttonType={AppleButton.Type.SIGN_UP}
                style={{
                  width: 160, // You must specify a width
                  height: 42, // You must specify a height
                  marginHorizontal: 5,
                }}
                onPress={this.signInWithApple}
              />
            )}

            <GoogleSigninButton
              // disabled={isProcessing || isAuthenticating}
              style={{
                width: 192,
                height: 48,
                marginHorizontal: 5,
                borderRadius: 5,
              }}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Light}
              onPress={this.signInWithGoogle}
            />
          </View>
        </View>
      );
    } else {
      authComponents = (
        <View
          style={{
            flex: 1,
            // paddingBottom: windowWidth * 0.8 * 0.271,
            paddingBottom: bottomInset + windowHeight * 0.1,
            // justifyContent: 'center',
          }}>
          <View
            style={{
              flex: 1,
              // justifyContent: 'center',
            }}>
            <NavButton
              isProcessing={isProcessing}
              iconName="arrow-back-ios"
              iconSize={18}
              iconColor="#000000"
              action={this.performAction('login')}
            />

            <InputField
              key={`email-${inputMode}`}
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="email"
              keyboardType="email-address"
              placeholder="Email"
              returnKeyType="done"
              textContentType="emailAddress"
              focusAction={this.resetPassword}
              updateInputValue={this.authUpdateInputValue}
              error={emailError}
              selector="email"
              // extraStyles={{ marginVertical: 7 }}
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <AuthActionButton
              isProcessing={isProcessing}
              label="Reset Password"
              backgroundColor="#0076CE"
              action={this.resetPassword}
            />
          </View>
        </View>
      );
    }

    return <View style={styles.bottomSheetSurface}>{authComponents}</View>;
  };

  render() {
    const {
      isBottomSheetOpen,
      isProcessing,
      contentSelector,
      showSnackbar,
      snackbarMessage,
      hideIndicator = true,
    } = this.state;

    let renderContent = null;
    if (contentSelector === 'createNote') {
      renderContent = this.renderCreateNote;
    } else if (contentSelector === 'editNote') {
      renderContent = this.renderEditNote;
    } else if (contentSelector === 'shareSheet') {
      renderContent = this.renderShareSheet;
    } else if (contentSelector === 'selectNote') {
      renderContent = this.renderSelectNote;
    } else if (contentSelector === 'pinPostToNote') {
      renderContent = this.renderPinPost;
    } else if (contentSelector === 'locationFilter') {
      renderContent = this.renderLocationFilter;
    } else if (contentSelector === 'showOnMap') {
      renderContent = this.renderShowOnMap;
    } else if (contentSelector === 'editPost') {
      renderContent = this.renderEditPost;
    } else if (contentSelector === 'reportPost') {
      renderContent = this.renderReportSheet;
    } else if (contentSelector === 'userAuthentication') {
      renderContent = this.renderUserAuthentication;
    }

    return (
      <>
        {isBottomSheetOpen && this.renderBackdrop()}

        <BottomSheet
          ref={this.bottomSheetRef}
          snapPoints={snapPoints}
          initialSnap={snapPoints.length - 1}
          // borderRadius={30}
          enabledContentTapInteraction={false}
          renderContent={renderContent}
          renderHeader={this.renderBottomSheetHeader}
          onCloseEnd={this.hideBottomSheetPanel}
        />

        {isProcessing && (
          <ModalActivityIndicatorAlt
            hideIndicator={hideIndicator}
            opacity={0.1}
            color="gray"
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
      </>
    );
  }
}

const NavButton = ({
  isProcessing,
  inputMode,
  iconName,
  iconSize,
  iconColor,
  action,
}) => {
  const isLoggingIn = inputMode === 'login';

  return (
    <View style={[styles.buttonLikeContainer, { marginBottom: 40 }]}>
      <TouchableOpacity
        disabled={isProcessing}
        activeOpacity={0.9}
        style={{
          position: 'absolute',
          top: 0,
          [isLoggingIn ? 'right' : 'left']: 0,
          flexDirection: isLoggingIn ? 'row' : 'row-reverse',
          alignItems: 'center',
          paddingVertical: 7,
        }}
        onPress={action}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14,
            color: isProcessing ? '#AAAAAA' : 'black',
            [`margin${isLoggingIn ? 'Right' : 'Left'}`]: 5,
          }}>
          {isLoggingIn ? 'Sign up' : 'Login'}
        </Text>
        <MaterialIcon
          name={iconName}
          size={iconSize}
          color={isProcessing ? '#AAAAAA' : iconColor || 'black'}
        />
      </TouchableOpacity>
    </View>
  );
};

const AuthActionButton = ({ isProcessing, backgroundColor, label, action }) => (
  <TouchableOpacity
    disabled={isProcessing}
    activeOpacity={0.9}
    style={[styles.button, { backgroundColor }]}
    onPress={action}>
    {isProcessing ? (
      <ActivityIndicator size="small" color="white" />
    ) : (
      <Text allowFontScaling={false} style={styles.buttonLabel}>
        {label}
      </Text>
    )}
  </TouchableOpacity>
);

const InputField = ({
  refSelector,
  isProcessing,
  autoCompleteType,
  keyboardType,
  placeholder,
  returnKeyType,
  textContentType,
  error,
  focusAction,
  updateInputValue,
  selector,
  autoCapitalize = 'none',
  secureTextEntry = false,
  extraStyles = {},
  containerStyle = {},
  extraErrorStyles = {},
}) => {
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <View style={containerStyle}>
      <EnjagaTextInput
        ref={refSelector(selector)}
        secureTextEntry={hidePassword && secureTextEntry}
        editable={!isProcessing}
        allowFontScaling={false}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoCompleteType={autoCompleteType}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={isAndroid ? undefined : '#BBBBBB'}
        returnKeyType={returnKeyType}
        textContentType={textContentType}
        style={[styles.textInput, { ...extraStyles }]}
        onSubmitEditing={focusAction}
        onChangeText={updateInputValue(selector)}
      />

      {!!secureTextEntry && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.passVisibilityButton}
          onPress={() => setHidePassword(!hidePassword)}>
          <MaterialIcon
            name={hidePassword ? 'visibility-off' : 'visibility'}
            size={20}
            color={isProcessing ? '#AAAAAA' : 'black'}
          />
        </TouchableOpacity>
      )}

      {error && (
        <Animatable.View
          animation="flash"
          ref={refSelector(`${selector}Error`)}
          style={[styles.errorCircle, { ...extraErrorStyles }]}
        />
      )}
    </View>
  );
};

const LocationSearch = ({ preferredLocation, setPreferredLocation }) => {
  const autoCompleteRef = useRef();

  useEffect(() => {
    autoCompleteRef.current?.setAddressText(preferredLocation || '');
  }, []);

  const renderEmptySearchList = () => (
    <View style={{ backgroundColor: 'white', paddingVertical: 15 }}>
      <Text style={{ fontSize: 12, textAlign: 'center', color: '#AAAAAA' }}>
        No matching results
      </Text>
    </View>
  );

  return (
    <GooglePlacesAutocomplete
      ref={autoCompleteRef}
      autoFillOnNotFound
      fetchDetails
      enablePoweredByContainer={false}
      placeholder="Search"
      minLength={0}
      onPress={setPreferredLocation}
      // currentLocation
      // currentLocationLabel="Current location"
      // keyboardShouldPersistTaps="never"
      predefinedPlaces={[currentLocation]}
      query={{
        key: 'AIzaSyAqZGkR0XP10HNHhFFvUiwHSxgq5W9s1iE',
        language: 'en',
      }}
      textInputProps={{
        selectTextOnFocus: true,
        placeholderTextColor: isAndroid ? undefined : '#BBBBBB',
        // defaultValue: 'Food for all',
      }}
      styles={{
        listView: {
          maxWidth: '90%',
        },
        textInputContainer: {
          height: 40,
          maxWidth: '90%',
          borderRadius: 10,
        },
        container: {
          position: 'absolute',
          top: 5,
          left: '2%',
          right: '2%',
          width: '95%',
          alignSelf: 'center',
        },
      }}
      listEmptyComponent={renderEmptySearchList}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  bottomSheetSurface: {
    // position: 'absolute',
    // top: 20,
    // left: '10%',
    // padding: 7,
    // borderRadius: 15,
    // backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    height: windowHeight * 0.72,
    // paddingBottom: windowHeight * 0.2,
    // elevation: 4,
  },
  panelHeader: {
    paddingTop: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelHandle: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'black',
    marginBottom: 10,
  },
  submitButton: {
    borderWidth: 1,
    borderColor: '#B7B6B6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: Math.min(windowWidth * 0.9, 500),
    // borderWidth: 1,
    alignSelf: 'center',
    // maxWidth: 200,
    marginTop: 40,
  },
  cameraIconSurface: {
    position: 'absolute',
    top: 10,
    left: '5%',
    padding: 7,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  divider: {
    marginTop: 10,
    marginBottom: 10,
    // marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    width: '90%',
    alignSelf: 'center',
  },
  actionButton: {
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
    backgroundColor: '#00D8C6',
  },
  userInfoSection: {
    paddingLeft: 20,
    flex: 1,
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  mapContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: windowWidth * 0.9,
    // height: Math.min(windowHeight * 0.5, 400),
    height: windowHeight * 0.4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: windowWidth * 0.9,
    marginTop: 20,
  },
  resetFilterButton: {
    borderWidth: 1,
    borderColor: '#B7B6B6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 120,
  },
  applyFilterButton: {
    // borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 120,
    backgroundColor: '#00D8C6',
  },
  button: {
    width: 300,
    height: 40,
    maxWidth: windowWidth * 0.7,
    marginVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    color: 'white',
  },
  textInput: {
    width: 300,
    height: 40,
    maxWidth: windowWidth * 0.7,
    marginVertical: 10,
    paddingLeft: 20,
    borderRadius: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#727272',
  },
  buttonLikeContainer: {
    width: 300,
    height: 30,
    maxWidth: windowWidth * 0.7,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  passVisibilityButton: {
    position: 'absolute',
    bottom: 15,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: 4,
    paddingHorizontal: 4,
    paddingBottom: 4,
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
  const {
    cachedState: { notes } = {},
    userState: { userDetails, locationPreference } = {},
  } = state;

  return {
    locationPreference,
    notes: notes ?? [],
    userDetails: userDetails ?? {},
  };
};

export default connect(mapStateToProps)(BottomSheetPanel);
