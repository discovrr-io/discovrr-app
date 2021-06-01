import React, { Component, useState, useEffect, useRef } from 'react';

import {
  // ActivityIndicator,
  Animated,
  Keyboard,
  NativeEventEmitter,
  // SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';

import { connect } from 'react-redux';

import { Surface } from 'react-native-paper';

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { HeaderHeightContext } from '@react-navigation/stack';

import { withSafeAreaInsets } from 'react-native-safe-area-context';

import RNPopoverMenu from 'react-native-popover-menu';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
// import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';

import { isAndroid, windowWidth } from './utilities/Constants';

import { logException } from './utilities/NetworkRequests';

import { updateProfile } from './utilities/Actions';

const Parse = require('parse/react-native');

class AccountSettingsScreen extends Component {
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

    if (props.userDetails) {
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

  updateInputValue =
    (input) =>
    (value = '') => {
      debugAppLogger({
        info: 'AccountSettingsScreen updateInputValue',
        input,
        value,
      });

      this[input] = value.trim();
      this.setState({
        [`${input}Error`]: false,
      });
    };

  validateInput = (input) => () => {
    debugAppLogger({
      info: 'AccountSettingsScreen validateInput',
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

              if (input === 'hometown') {
                const { geometry: { location: { lat, lng } = {} } = {} } =
                  extraData || {};

                if (lat && lng) {
                  const geoPoint = new Parse.GeoPoint(lat, lng);
                  parseUserProfile.set('geoPoint', geoPoint);
                }
              }

              parseUserProfile.set(input, this[input]);

              await parseUserProfile.save();

              this.dispatch(updateProfile({ [input]: this[input] }));

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

  flashErrorIndicator = (errorType) => {
    try {
      const { [errorType]: errorValue } = this.state;
      debugAppLogger({
        info: 'AccountSettingsScreen flashErrorIndicator',
        errorType,
        errorValue,
      });

      if (errorValue) {
        this[errorType].flash(1000).then(() => {});
      } else {
        this.setState({ [errorType]: true });
      }
    } catch (e) {
      // TODO
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
      isUploading,
      animatedHeight,
    } = this.state;

    const {
      insets: { bottom: bottomInset },
      userDetails: { displayName, name, surname, hometown, description },
    } = this.props;

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
              <View
                style={{
                  // paddingTop: headerHeight,
                  paddingTop: 20,
                }}>
                <InputField
                  refSelector={this.refSelector}
                  label="Username"
                  defaultValue={displayName && `@${displayName}`}
                  autoCompleteType="name"
                  keyboardType="default"
                  placeholder="@username"
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

                <InputField
                  refSelector={this.refSelector}
                  label="First Name"
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

                <InputField
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

                <View style={styles.divider} />

                <InputField
                  refSelector={this.refSelector}
                  label="Email"
                  defaultValue={surname}
                  autoCompleteType="name"
                  keyboardType="default"
                  placeholder="Email"
                  returnKeyType="done"
                  textContentType="name"
                  // focusAction={this.focusField('surname')}
                  updateInputValue={this.updateInputValue}
                  error={surnameError}
                  selector="surname"
                  extraStyles={{ marginVertical: 0 }}
                  blurred={this.validateInput}
                />

                <View style={styles.divider} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
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
    top: 20,
    left: '10%',
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

export default connect(mapStateToProps)(
  withSafeAreaInsets(AccountSettingsScreen),
);
