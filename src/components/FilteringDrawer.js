import React, {
  Component, useEffect, useRef,
} from 'react';

import {
  DeviceEventEmitter,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import Slider from '@react-native-community/slider';

import MapView, {
  Circle,
  Marker,
} from 'react-native-maps';

import {
  withSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  GooglePlacesAutocomplete,
} from 'react-native-google-places-autocomplete';

import {
  Caption,
  IconButton,
  Text,
} from 'react-native-paper';

import {
  connect,
} from 'react-redux';

import {
  windowHeight,
  windowWidth,
} from '../utilities/Constants';

import {SafeAreaView} from 'react-native-safe-area-context';
import {
  saveLocationPreference,
} from '../utilities/Actions';

// const Parse = require('parse/react-native');
const debounce = require('lodash/debounce');

class AppDrawer extends Component {
  constructor(props) {
    super(props);

    this.debouncedMapRegionChange = debounce(this.updateMapRegion, 500);

    this.pushedUpdate = '';

    ({
      dispatch: this.dispatch,
      navigation: {
        navigate: this.navigate,
      },
    } = props);

    let markers;
    let coordinates;
    let searchRadius = 5;
    let hasCoordinates = false;
    if (props.locationPreference) {
      hasCoordinates = true;
      this.preferredLocation = props.locationPreference.location;
      coordinates = {
        latitude: props.locationPreference.latitude,
        longitude: props.locationPreference.longitude,
      };
      searchRadius = props.locationPreference.searchRadius || 5;
      this.initialRegion = { ...props.locationPreference };
      this.region = {
        ...props.locationPreference,
        searchRadius,
      };

      markers = [{
        id: 'you',
        name: 'You',
        color: 'linen',
        coordinate: { ...coordinates },
      }];
    } else {
      this.initialRegion = {
        latitude: -33.88013879489698,
        longitude: 151.1145074106,
        latitudeDelta: 1.2327156923275737,
        longitudeDelta: 1.20815712958743,
      };
    }

    this.state = {
      coordinates,
      hasCoordinates,
      markers,
      searchRadius,
      locationKey: 1,
    };
  }

  componentDidMount() {
    DeviceEventEmitter.addListener('locationUpdate', this.updateLocation);
  }

  componentWillUnmount() {
    DeviceEventEmitter.removeListener('locationUpdate', this.updateLocation);
  }

  componentReference = (refSelector) => (compRef) => { this[refSelector] = compRef; }

  closeDrawer = () => {
    const {
      navigation: {
        closeDrawer,
      } = {},
    } = this.props;

    Keyboard.dismiss();
    closeDrawer();
  }

  changeSearchRadius = (searchRadius) => {
    this.setState({
      searchRadius,
    }, () => {
      this.debouncedMapRegionChange();
    });
  }

  regionChangeComplete = (data) => {
    // alert(JSON.stringify(data));
  }

  calculateRegion = (latitude, longitude, distance) => {
    const tempDistance = distance / 2;
    const circumference = 40075;
    const oneDegreeOfLatitudeInMeters = 111.32 * 1000;
    const angularDistance = tempDistance / circumference;

    const latitudeDelta = tempDistance / oneDegreeOfLatitudeInMeters;
    const longitudeDelta = Math.abs(Math.atan2(
      Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(longitude) * Math.sin(latitude),
    ));

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }

  updateLocation = (data) => {
    debugAppLogger({
      info: 'FilteringDrawer updateLocation',
      data,
    });

    if (data.description && data.geometry) this.setPreferredLocation(data, data, true);
  }

  setPreferredLocation = (data, details, updateLocationKey = false) => {
    try {
      debugAppLogger({ info: '>> Google places', data, details });

      const {
        description,
      } = data;

      const {
        geometry,
      } = details || {};

      if (description && geometry) {
        const markers = [{
          id: 'you',
          name: 'You',
          color: 'linen',
          coordinate: {
            latitude: geometry.location.lat,
            longitude: geometry.location.lng,
          },
        }];

        this.fitMarkerIds = ['job', 'you'];

        if (updateLocationKey) this.preferredLocation = description;

        const {
          locationKey,
          searchRadius,
        } = this.state;

        this.setState({
          markers,
          hasCoordinates: true,
          locationKey: updateLocationKey ? locationKey + 1 : locationKey,
          coordinates: {
            latitude: geometry.location.lat,
            longitude: geometry.location.lng,
          },
        }, () => {
          if (this.mapRef) {
            this.region = this.calculateRegion(
              geometry.location.lat,
              geometry.location.lng,
              (searchRadius * 1000) + (searchRadius * 2000),
            );

            this.region.searchRadius = searchRadius;
            this.region.location = description;

            this.mapRef.animateToRegion(this.region);

            this.dispatch(saveLocationPreference(this.region));
          }
        });
      }
    } catch (error) {
      debugAppLogger({ info: '>> Google places Error', error });
    }
  }

  updateMapRegion = () => {
    if (this.region) {
      const {
        searchRadius,
      } = this.state;

      this.region = this.calculateRegion(
        this.region.latitude,
        this.region.longitude,
        (searchRadius * 1000) + (searchRadius * 2000),
      );

      this.region.searchRadius = searchRadius;
      this.mapRef.animateToRegion(this.region);
      this.dispatch(saveLocationPreference(this.region));
    }
  }

  render() {
    const {
      markers,
      hasCoordinates,
      coordinates,
      searchRadius,
      locationKey,
    } = this.state;

    const {
      insets,
      userDetails: {
        avatar: {
          url: avatarUrl,
        } = {},
      } = {},
    } = this.props;

    return (
      <View style={{ flex: 1, marginTop: 0, paddingTop: (insets && insets.top) || undefined }}>
        <View style={styles.userInfoSection}>

          <IconButton
            icon="chevron-left"
            color="#777777"
            size={28}
            style={{ alignSelf: 'flex-end' }}
            onPress={this.closeDrawer}
            // onPress={() => this.props.navigation.dangerouslyGetParent().dispatch(DrawerActions.toggleDrawer())}
          />

          <Caption style={styles.caption}>Set current Location</Caption>

          <View style={styles.mapContainer}>
            <MapView
              // provider={PROVIDER_GOOGLE}
              ref={this.componentReference('mapRef')}
              style={styles.map}
              showsCompass
              loadingEnabled
              loadingIndicatorColor="#099EA3"
              loadingBackgroundColor="white"
              initialRegion={this.initialRegion}
              // onMapReady={this.mapHasLoaded}
              // onDoublePress={this.mapPressed}
              // onPress={this.mapPressed}
              onRegionChangeComplete={this.regionChangeComplete}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {hasCoordinates && (
                markers.map(({ id, coordinate, name, color }) => (
                  <MapView.Marker
                    key={name}
                    identifier={id}
                    pinColor={color}
                    coordinate={coordinate}
                    title={name}
                    // onPress={this.markerPressed}
                  />
                ))
              )}

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

            {/*<GooglePlacesAutocomplete*/}
            {/*  autoFillOnNotFound*/}
            {/*  // currentLocation*/}
            {/*  fetchDetails*/}
            {/*  enablePoweredByContainer={false}*/}
            {/*  placeholder="Search"*/}
            {/*  minLength={0}*/}
            {/*  onPress={this.setPreferredLocation}*/}
            {/*  query={{*/}
            {/*    key: 'AIzaSyAqZGkR0XP10HNHhFFvUiwHSxgq5W9s1iE',*/}
            {/*    language: 'en',*/}
            {/*  }}*/}
            {/*  textInputProps={{*/}
            {/*    selectTextOnFocus: true,*/}
            {/*    defaultValue: 'Food for all',*/}
            {/*  }}*/}
            {/*  styles={{*/}
            {/*    textInputContainer: {*/}
            {/*      height: 40,*/}
            {/*      maxWidth: windowWidth * 0.7,*/}
            {/*      borderRadius: 10,*/}
            {/*    },*/}
            {/*    container: {*/}
            {/*      position: 'absolute',*/}
            {/*      top: 5,*/}
            {/*      width: '95%',*/}
            {/*      alignSelf: 'center',*/}
            {/*    },*/}
            {/*  }}*/}
            {/*  listEmptyComponent={this.renderEmptySearchList}*/}
            {/*/>*/}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, maxWidth: windowWidth * 0.7 }}>
            <Caption style={[styles.caption, { color: '#099EA3' }]}>
              Search radius
            </Caption>

            <Caption style={[styles.caption, { color: '#099EA3', fontWeight: 'bold' }]}>
              {searchRadius}
            </Caption>
          </View>

          <Slider
            style={{ width: Math.min(windowWidth * 0.7, 350), height: 40 }}
            minimumValue={1}
            maximumValue={50}
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
            >
              <Text
                allowFontScaling={false}
                style={{ fontSize: 12, color: '#727272', textAlign: 'center' }}
              >
                Reset Filters
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.applyFilterButton}
            >
              <Text
                allowFontScaling={false}
                style={{ fontSize: 12, color: 'white', textAlign: 'center' }}
              >
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  }
}

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
      // currentLocation
      fetchDetails
      enablePoweredByContainer={false}
      placeholder="Search"
      minLength={0}
      onPress={setPreferredLocation}
      query={{
        key: 'AIzaSyAqZGkR0XP10HNHhFFvUiwHSxgq5W9s1iE',
        language: 'en',
      }}
      textInputProps={{
        selectTextOnFocus: true,
        defaultValue: 'Food for all',
      }}
      styles={{
        textInputContainer: {
          height: 40,
          maxWidth: windowWidth * 0.7,
          borderRadius: 10,
        },
        container: {
          position: 'absolute',
          top: 5,
          width: '95%',
          alignSelf: 'center',
        },
      }}
      listEmptyComponent={renderEmptySearchList}
    />
  );
};

const styles = StyleSheet.create({
  userInfoSection: {
    paddingLeft: 20,
    flex: 1,
  },
  title: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  mapContainer: {
    width: Math.min(windowWidth * 0.7, 350),
    marginTop: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'orange',
  },
  map: {
    width: Math.min(windowWidth * 0.7, 350),
    height: Math.min(windowHeight * 0.5, 400),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: windowWidth * 0.7,
    marginTop: 30,
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
});

const mapStateToProps = (state) => {
  const {
    userState: {
      locationPreference,
      userDetails = {},
    } = {},
  } = state;

  return ({
    locationPreference,
    userDetails,
  });
};

export default connect(mapStateToProps)(withSafeAreaInsets(AppDrawer));
