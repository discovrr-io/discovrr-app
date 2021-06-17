import React, { Component, useState, useEffect, useRef } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Linking,
  NativeEventEmitter,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';

import { connect } from 'react-redux';
import { getVersion } from 'react-native-device-info';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { HeaderHeightContext } from '@react-navigation/stack';
import { Surface } from 'react-native-paper';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import ProgressCircle from 'react-native-progress/Circle';
import RNPopoverMenu from 'react-native-popover-menu';
import storage from '@react-native-firebase/storage';

import { isAndroid, windowWidth } from '../../utilities/Constants';
import { logException } from '../../utilities/NetworkRequests';
import { updateProfile } from '../../utilities/Actions';

const cameraIcon = <MaterialIcon name="camera-alt" color="#000000" size={24} />;
const photosIcon = (
  <MaterialIcon name="collections" color="#000000" size={24} />
);

const Parse = require('parse/react-native');

const defaultAvatar = require('../../../resources/images/defaultAvatar.jpeg');
const defaultCoverPhoto = require('../../../resources/images/imagePlaceholder.png');

const appVersion = getVersion();

class ProfileEditScreen extends Component {
  constructor(props) {
    super(props);

    ({
      dispatch: this.dispatch,
      navigation: {
        addListener: this.addListener,
        removeListener: this.removeListener,
      },
    } = props);

    this.locationUpdateEmitter = new NativeEventEmitter('locationUpdate');

    debugAppLogger({
      info: 'constructor - ProfileEditScreen',
      userDetails: props.userDetails,
    });

    if (props.userDetails) {
      this.avatar = props.userDetails.avatar || {};
      this.coverPhoto = props.userDetails.coverPhoto || {};
      this.name = props.userDetails.name || '';
      this.nameOld = props.userDetails.name || '';
      this.surname = props.userDetails.surname || '';
      this.surnameOld = props.userDetails.surname || '';
      this.description = props.userDetails.description || '';
      this.descriptionOld = props.userDetails.description || '';
      this.hometown = props.userDetails.hometown || '';
      this.hometownOld = props.userDetails.hometown || '';
    }

    this.state = {
      isUploading: false,
      animatedHeight: new Animated.Value(0),
    };
  }

  componentDidMount() {
    if (isAndroid) {
      this.subscriptions = [
        Keyboard.addListener('keyboardDidShow', this.keyboardWillShow),
        Keyboard.addListener('keyboardDidHide', this.keyboardWillHide),
        // BackHandler.addEventListener('hardwareBackPress', this.handleBackPress),
      ];
    } else {
      this.subscriptions = [
        Keyboard.addListener('keyboardWillShow', this.keyboardWillShow),
        Keyboard.addListener('keyboardWillHide', this.keyboardWillHide),
      ];
    }
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

  showPicker = () => () => {
    Keyboard.dismiss();

    if (isAndroid) {
      const menuItems = [
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

      RNPopoverMenu.Show(this.changeImageRef, {
        textColor: '#000000',
        menus: menuItems,
        onDone: (section, menuIndex) => {
          // alert(menuIndex)
        },
        onCancel: () => {},
      });
    } else {
      //
    }
  };

  updateInputValue =
    (input) =>
    (value = '') => {
      debugAppLogger({
        info: 'ProfileEditScreen updateInputValue',
        input,
        value,
      });

      this[input] = value.trim();
      this.setState({
        [`${input}Error`]: false,
      });
    };

  showImageAttachmentOptions = (selector) => () => {
    RNPopoverMenu.Show(this[`${selector}Ref`], {
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
          width: 800,
          height: 800,
          compressImageQuality: 0.8,
          cropping: true,
          cropperCircleOverlay: selector === 'avatar',
          cropperToolbarTitle: 'Edit Photo',
          cropperActiveWidgetColor: '#00D8C6',
          cropperStatusBarColor: '#000000',
        })
          .then(({ size, path, mime, width, height }) => {
            debugAppLogger({
              info: `${selector} attached image details`,
              size,
              path,
              mime,
              width,
              height,
            });

            this[selector] = { size, path, mime, width, height, type: 'image' };

            this.setState(
              {
                [`${selector}Uri`]: path,
              },
              () => {
                this.syncProfileChanges(selector);
              },
            );
          })
          .catch((error) => {
            const { message, code } = error;

            debugAppLogger({
              info: `ProfileEditScreen ${selector} showImageAttachmentOptions ImagePicker Error`,
              errorMessage: message,
              error,
            });

            if (code && code === 'E_PERMISSION_MISSING') {
              Alert.alert(
                'Permissions Denied',
                message,
                [
                  {
                    text: 'Back',
                  },
                  {
                    text: 'Settings',
                    onPress: () => {
                      Linking.openSettings('app-settings:').catch(() => {
                        // alert(e.message);
                      });
                    },
                  },
                ],
                {
                  cancelable: true,
                  onDismiss: () => {},
                },
              );
            }
          });
      },
      onCancel: () => {},
    });
  };

  validateInput = (input) => () => {
    debugAppLogger({
      info: 'ProfileEditScreen validateInput',
      input,
      inputValue: this.name,
    });

    if (this[input] && this[input].trim()) {
      if (this[input].trim() !== this[`${input}Old`])
        this.syncProfileChanges(input);
    } else {
      this.flashErrorIndicator(`${input}Error`);
    }
  };

  setPreferredLocation = (data, details) => {
    try {
      debugAppLogger({ info: '>> Google places', data, details });

      if (details && details.geometry) {
        const extraData = {
          description: data.description,
          geometry: details.geometry,
        };

        this.hometown = data.description;

        this.syncProfileChanges('hometown', extraData);
      }
    } catch (error) {
      debugAppLogger({ info: '>> Google places Error', error });
    }
  };

  syncProfileChanges = (input, extraData) => {
    try {
      Parse.User.currentAsync()
        .then(async (currentUser) => {
          debugAppLogger({
            info: 'syncProfileChanges currentUser',
            currentUser,
            input,
            extraData,
          });

          if (currentUser) {
            const query = new Parse.Query(Parse.Object.extend('Profile'));
            query.equalTo('owner', currentUser);
            const results = await query.find();

            if (Array.isArray(results) && results.length) {
              const [parseUserProfile] = results;

              let avatar;
              if (input === 'avatar' || input === 'coverPhoto') {
                const filename = `${input}s/${
                  parseUserProfile.id
                }_${Math.random().toString(36).substring(2)}.jpg`;
                const uploadUri = isAndroid
                  ? this[input].path
                  : this[input].path.replace('file://', '');

                this.task = storage().ref(filename).putFile(uploadUri);

                this.setState({
                  isUploading: true,
                  uploadType: input,
                });

                await this.task;

                const imageUrl = await storage()
                  .ref(filename)
                  .getDownloadURL()
                  .catch(() => {});

                avatar = { ...this[input], path: filename, url: imageUrl };
                parseUserProfile.set(input, avatar);
              } else {
                if (input === 'hometown') {
                  const { geometry: { location: { lat, lng } = {} } = {} } =
                    extraData || {};

                  if (lat && lng) {
                    const geoPoint = new Parse.GeoPoint(lat, lng);
                    parseUserProfile.set('geoPoint', geoPoint);
                  }
                }

                parseUserProfile.set(input, this[input]);
              }

              await parseUserProfile.save();

              if (input === 'avatar' || input === 'coverPhoto') {
                this.dispatch(updateProfile({ [input]: avatar }));
              } else {
                this.dispatch(updateProfile({ [input]: this[input] }));
              }

              this[`${input}Old`] = this[input];

              if (input === 'hometown')
                this.locationUpdateEmitter.emit('locationUpdate', extraData);
            }
          } else {
            // alert('should logout the donkey');
            // this.dispatch(logout());
          }
        })
        .catch((error) => {
          debugAppLogger({ info: 'Error parse checkCurrent user!', error });
          // this.errorLogout();
        });
    } catch (error) {
      debugAppLogger({ info: 'Catch Error parse checkCurrent user!!', error });
      // this.errorLogout();
    }
  };

  uploadFinsished = () => {
    this.setState({
      isUploading: false,
      uploadType: '',
    });

    debugAppLogger({ info: 'ProfileEditScreen ****Uploading avatar finished' });
  };

  flashErrorIndicator = (errorType) => {
    try {
      const { [errorType]: errorValue } = this.state;
      debugAppLogger({
        info: 'ProfileEditScreen flashErrorIndicator',
        errorType,
        errorValue,
      });

      if (errorValue) {
        this[errorType].flash(1000).then(() => {});
      } else {
        this.setState({ [errorType]: true });
      }
    } catch (e) {
      //
    }
  };

  errorLogout = () => {
    Parse.User.logOut()
      .then(() => {})
      .catch((innerError) => logException({ error: innerError }));
  };

  render() {
    const {
      showStatusBar,
      nameError,
      surnameError,
      descriptionError,
      hometownError,
      interestsError,
      avatarUri,
      coverPhotoUri,
      isUploading,
      uploadType,
      animatedHeight,
    } = this.state;

    const {
      insets: { bottom: bottomInset },
      userDetails: {
        name,
        surname,
        hometown,
        description,
        avatar: { url: avatarUrl } = {},
        coverPhoto: { url: coverPhotoUrl } = {},
      },
    } = this.props;

    // const avatarImage = avatarUri || avatarUrl ? { uri: avatarUri || avatarUrl } : defaultAvatar;
    const imageWidth = windowWidth - 60;
    let imageHeight = imageWidth * (640 / 566);
    let avatarImage = defaultAvatar;
    let coverPhotoImage = defaultCoverPhoto;

    if (coverPhotoUri || coverPhotoUrl) {
      coverPhotoImage = {
        uri: avatarUri || avatarUrl,
      };
      imageHeight =
        imageWidth * (this.coverPhoto.height / this.coverPhoto.width);
    }

    debugAppLogger({
      info: 'ProfileEditScreen render',
      avatar: this.avatar,
      coverPhoto: this.coverPhoto,
      avatarUri,
      avatarImage,
      coverPhotoUri,
      coverPhotoImage,
    });

    return (
      <HeaderHeightContext.Consumer>
        {(headerHeight) => (
          <View
            style={{
              flex: 1,
              backgroundColor: 'white',
              paddingBottom: bottomInset || 0,
            }}>
            {/* <SafeAreaView style={styles.container}> */}
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={{ paddingTop: headerHeight }}>
                <View
                  style={{
                    paddingLeft: 20,
                    // paddingRight: 20,
                    paddingTop: 10,
                    paddingBottom: 20,
                    // marginBottom: 10,
                    marginHorizontal: 10,
                    borderTopWidth: 1,
                    borderTopColor: '#CCCCCC',
                    borderBottomWidth: 1,
                    borderBottomColor: '#CCCCCC',
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 12,
                      color: '#666666',
                      marginBottom: 10,
                    }}>
                    Select Cover Photo
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    // style={{ marginBottom: 20 }}
                    onPress={this.showImageAttachmentOptions('coverPhoto')}>
                    <AvatarImage
                      type="coverPhoto"
                      newAvatar={coverPhotoUri}
                      remoteAvatar={coverPhotoUrl}
                      avatarDetails={this.coverPhoto}
                      isUploading={isUploading}
                      uploadType={uploadType}
                      uploadTask={this.task}
                      uploadFinsished={this.uploadFinsished}
                    />

                    <Surface style={styles.cameraIconSurface}>
                      <MaterialCommunityIcon
                        ref={this.refSelector('coverPhotoRef')}
                        name="camera-plus"
                        size={20}
                        color="black"
                      />
                    </Surface>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    paddingLeft: 20,
                    // paddingRight: 20,
                    paddingTop: 20,
                    paddingBottom: 20,
                    marginBottom: 10,
                    marginHorizontal: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#CCCCCC',
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 12,
                      color: '#666666',
                      marginBottom: 10,
                    }}>
                    Select Profile Image
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    // style={{ marginBottom: 20 }}
                    onPress={this.showImageAttachmentOptions('avatar')}>
                    <AvatarImage
                      type="avatar"
                      newAvatar={avatarUri}
                      remoteAvatar={avatarUrl}
                      avatarDetails={this.avatar}
                      isUploading={isUploading}
                      uploadType={uploadType}
                      uploadTask={this.task}
                      uploadFinsished={this.uploadFinsished}
                    />

                    <Surface
                      style={{
                        position: 'absolute',
                        top: '5%',
                        left: '5%',
                        padding: 7,
                        borderRadius: 15,
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      }}>
                      <MaterialCommunityIcon
                        ref={this.refSelector('avatarRef')}
                        name="camera-plus"
                        size={20}
                        color="black"
                      />
                    </Surface>
                  </TouchableOpacity>
                </View>

                <InputField
                  refSelector={this.refSelector}
                  label="Name"
                  defaultValue={name}
                  autoCompleteType="name"
                  keyboardType="default"
                  placeholder="Name"
                  returnKeyType="done"
                  textContentType="name"
                  // focusAction={this.focusField('surname')}
                  updateInputValue={this.updateInputValue}
                  error={nameError}
                  selector="name"
                  extraStyles={{ marginVertical: 0 }}
                  blurred={this.validateInput}
                />

                <View style={styles.divider} />

                {/* <InputField
                  refSelector={this.refSelector}
                  label="Surname"
                  defaultValue={surname}
                  autoCompleteType="name"
                  keyboardType="default"
                  placeholder="Surname"
                  returnKeyType="done"
                  textContentType="name"
                  // focusAction={this.focusField('surname')}
                  updateInputValue={this.updateInputValue}
                  error={surnameError}
                  selector="surname"
                  extraStyles={{ marginVertical: 0 }}
                  blurred={this.validateInput}
                />

                <View style={styles.divider} /> */}

                {/* <InputField
                  disabled
                  refSelector={this.refSelector}
                  label="Interests"
                  // defaultValue={surname}
                  autoCompleteType="off"
                  keyboardType="default"
                  placeholder="..."
                  returnKeyType="done"
                  textContentType="none"
                  // focusAction={this.focusField('surname')}
                  updateInputValue={this.updateInputValue}
                  error={interestsError}
                  selector="interests"
                  extraStyles={{ marginVertical: 0 }}
                  blurred={this.validateInput}
                />

                <View style={styles.divider} /> */}

                <InputField
                  refSelector={this.refSelector}
                  multiline
                  // isProcessing={isProcessing}
                  fontSize={12}
                  label="Profile Description"
                  defaultValue={description}
                  autoCompleteType="off"
                  keyboardType="default"
                  placeholder="..."
                  returnKeyType="done"
                  textContentType="none"
                  // focusAction={this.focusField('surname')}
                  updateInputValue={this.updateInputValue}
                  error={descriptionError}
                  selector="description"
                  extraStyles={{ fontSize: 12, marginVertical: 0 }}
                  blurred={this.validateInput}
                />

                <View style={styles.divider} />

                <LocationSearch
                  hometown={hometown}
                  setPreferredLocation={this.setPreferredLocation}
                />
              </View>

              <Animated.View style={{ height: animatedHeight }} />
            </ScrollView>
            {/* </SafeAreaView> */}

            <StatusBar barStyle="dark-content" />
          </View>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

const InputField = ({
  refSelector,
  isProcessing,
  defaultValue,
  multiline,
  label,
  autoCompleteType,
  keyboardType,
  placeholder,
  returnKeyType,
  textContentType,
  error,
  focusAction,
  updateInputValue,
  selector,
  blurred = () => {},
  disabled = false,
  secureTextEntry = false,
  extraStyles = {},
  containerStyle = {},
  extraErrorStyles = {},
}) => {
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <View style={{ paddingLeft: 30, paddingRight: 20 }}>
      <View style={containerStyle}>
        <Text
          allowFontScaling={false}
          style={{ fontSize: 12, color: '#666666', marginBottom: 10 }}>
          {label}
        </Text>

        <TextInput
          ref={refSelector(`${selector}Input`)}
          secureTextEntry={hidePassword && secureTextEntry}
          multiline={multiline}
          editable={!disabled && !isProcessing}
          defaultValue={defaultValue}
          allowFontScaling={false}
          autoCorrect={false}
          autoCompleteType={autoCompleteType}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={isAndroid ? undefined : '#BBBBBB'}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          style={[styles.textInput, { ...extraStyles }]}
          onBlur={blurred(selector)}
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
    </View>
  );
};

const LocationSearch = ({ hometown, setPreferredLocation }) => {
  const autoCompleteRef = useRef();

  useEffect(() => {
    autoCompleteRef.current?.setAddressText(hometown || '');
  }, []);

  return (
    <View style={{ paddingLeft: 30, marginBottom: 50 }}>
      <Text
        allowFontScaling={false}
        style={{ fontSize: 12, color: '#666666', marginBottom: 10 }}>
        Hometown
      </Text>

      <GooglePlacesAutocomplete
        ref={autoCompleteRef}
        autoFillOnNotFound
        // currentLocation
        fetchDetails
        enablePoweredByContainer={false}
        placeholder="Search"
        minLength={0}
        onPress={setPreferredLocation}
        anchor="top"
        query={{
          key: 'AIzaSyAqZGkR0XP10HNHhFFvUiwHSxgq5W9s1iE',
          language: 'en',
        }}
        textInputProps={{
          selectTextOnFocus: isAndroid,
          placeholderTextColor: isAndroid ? undefined : '#BBBBBB',
        }}
        styles={{
          textInputContainer: {
            height: 40,
            maxWidth: windowWidth * 0.9,
            // borderRadius: 10,
          },
          textInput: {
            paddingLeft: 0,
          },
          listView: {
            backgroundColor: 'red',
            // position: 'absolute',
            // top: 5,
            // width: '95%',
            // alignSelf: 'center',
          },
        }}
        // listEmptyComponent={this.renderEmptySearchList}
      />
    </View>
  );
};

const AvatarImage = ({
  type,
  newAvatar,
  remoteAvatar,
  avatarDetails,
  isUploading,
  uploadType,
  uploadTask,
  uploadFinsished,
}) => {
  const imageWidth = windowWidth - 50;
  let imageHeight = 150;
  // let imageHeight = imageWidth * (640 / 566);
  let avatarImage = type === 'coverPhoto' ? defaultCoverPhoto : defaultAvatar;

  if (newAvatar || remoteAvatar) {
    avatarImage = {
      uri: newAvatar || remoteAvatar,
    };

    imageHeight = imageWidth * (avatarDetails.height / avatarDetails.width);
  }

  const [imageLoaded, setImageLoaded] = useState(!remoteAvatar);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (isUploading && type === uploadType && uploadTask) {
    uploadTask.on('state_changed', (taskSnapshot) => {
      const progress = Math.round(
        (taskSnapshot.bytesTransferred * 100) / taskSnapshot.totalBytes,
      );
      setUploadProgress(progress);
      debugAppLogger({
        info: `${taskSnapshot.bytesTransferred} transferred out of ${taskSnapshot.totalBytes}`,
        progress,
      });
    });

    uploadTask.then(uploadFinsished);
  }

  // if (!isUploading && uploadProgress) setUploadProgress(0);

  return (
    <>
      <FastImage
        style={
          type === 'avatar'
            ? {
                width: 120,
                height: 120,
                borderRadius: 75,
                justifyContent: 'center',
                alignItems: 'center',
              }
            : [styles.avatarImage, { width: imageWidth, height: imageHeight }]
        }
        source={avatarImage}
        resizeMode={
          type === 'avatar'
            ? FastImage.resizeMode.cover
            : FastImage.resizeMode.fit
        }
        onLoad={() => setImageLoaded(true)}>
        {isUploading && type === uploadType && appVersion !== '0.0.3' && (
          <ProgressCircle
            // useNativeDriver
            // indeterminate
            showsText
            allowFontScaling={false}
            // width={null}
            // height={5}
            // borderColor="white"
            // unfilledColor="rgba(255, 255, 255, 0.7)"
            size={60}
            thickness={2}
            // fill="white"
            color="white"
            borderColor="#666666"
            progress={uploadProgress}
            style={{
              width: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(0, 0, 0 , 0.6)',
            }}
          />
        )}
      </FastImage>

      {!imageLoaded && (
        <ActivityIndicator
          size="large"
          color="black"
          style={{
            position: 'absolute',
            top: '50%',
            bottom: '50%',
            left: '50%',
            right: '50%',
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  avatarImage: {
    // width: Math.min(windowWidth / 2, 300),
    width: 'auto',
    // maxWidth: windowWidth,
    // height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 10,
  },
  divider: {
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  textInput: {
    fontSize: 18,
    color: 'black',
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
  cameraIconSurface: {
    position: 'absolute',
    top: '3%',
    left: '5%',
    padding: 7,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  cameraIconContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
});

const mapStateToProps = (state) => {
  const { userState: { locationPreference, userDetails = {} } = {} } = state;

  return {
    locationPreference,
    userDetails,
  };
};

export default connect(mapStateToProps)(withSafeAreaInsets(ProfileEditScreen));
