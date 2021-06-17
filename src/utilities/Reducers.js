import { combineReducers } from 'redux';

import * as ActionTypes from './ActionTypes';

const initialUserState = {
  isLoggedIn: 'notSignedIn',
  userDetails: {},
  locationPreference: null,
  configData: null,
};

const initialNetworkState = {
  isLoggingIn: false,
};

const initialCachedState = {
  loginCredentials: null,
  notes: [],
  posts: [],
  userPosts: [],
  likedPosts: [],
  nearMePosts: [],
  followingPosts: [],
  comments: {},
};

const initialAppContext = {
  activeMerchantID: null,
};

const initialCommunication = {
  notifications: { messages: [], lastNotificationID: null, count: 0 },
};

const initialLocalization = {
  languages: null,
  selectedLanguage: 'en',
  translations: null,
};

const userState = (state = initialUserState, action) => {
  switch (action.type) {
    case ActionTypes.LOG_IN_SUCCEEDED:
      return {
        ...state,
        isLoggedIn: 'signedIn',
        userDetails: action.payload,
      };
    case ActionTypes.LOG_OUT:
    case ActionTypes.LOG_OUT_DONKEY:
    case ActionTypes.FORCED_EJECTION:
      return initialUserState;
    case ActionTypes.SAVE_LOCATION_PREFERENCE:
      return {
        ...state,
        locationPreference: action.payload,
      };
    case ActionTypes.UPDATE_PROFILE:
      return {
        ...state,
        userDetails: {
          ...state.userDetails,
          ...action.payload,
        },
      };
    case ActionTypes.UPDATE_FOLLOWING:
      return {
        ...state,
        userDetails: {
          ...state.userDetails,
          followingArray: action.payload,
        },
      };
    case ActionTypes.UPDATE_PINNED_POSTS:
      return {
        ...state,
        userDetails: {
          ...state.userDetails,
          pinnedPosts: action.payload,
        },
      };
    case ActionTypes.UPDATE_BLOCKED_PROFILES:
      return {
        ...state,
        userDetails: {
          ...state.userDetails,
          blockedProfiles: action.payload,
        },
      };
    default:
      return state;
  }
};

const networkState = (state = initialNetworkState, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

const cachedState = (state = initialCachedState, action) => {
  switch (action.type) {
    case ActionTypes.LOG_OUT:
    case ActionTypes.LOG_OUT_DONKEY:
    case ActionTypes.FORCED_EJECTION:
      return initialCachedState;
    case ActionTypes.SAVE_CREDENTIALS:
      return { ...state, loginCredentials: action.newData };
    case ActionTypes.UPDATE_NOTES:
      return {
        ...state,
        notes: action.payload,
      };
    case ActionTypes.UPDATE_POSTS:
      return {
        ...state,
        posts: action.payload,
      };
    case ActionTypes.UPDATE_USER_POSTS:
      return {
        ...state,
        userPosts: action.payload,
      };
    case ActionTypes.UPDATE_LIKED_POSTS:
      return {
        ...state,
        likedPosts: action.payload,
      };
    case ActionTypes.UPDATE_NEAR_ME_POSTS:
      return {
        ...state,
        nearMePosts: action.payload,
      };
    case ActionTypes.UPDATE_FOLLOWING_POSTS:
      return {
        ...state,
        followingPosts: action.payload,
      };
    case ActionTypes.UPDATE_COMMENTS:
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.selector]: action.payload,
        },
      };
    default:
      return state;
  }
};

const appContext = (state = initialAppContext, action) => {
  switch (action.type) {
    case ActionTypes.SAVE_LEFT_DRAWER_CONTEXT:
      return {
        ...state,
        toggleLeftDrawer: action.context,
      };
    default:
      return state;
  }
};

const communication = (state = initialCommunication, action) => {
  switch (action.type) {
    case ActionTypes.LOG_OUT:
      return {
        ...state,
        notifications: initialCommunication.notifications,
      };
    default:
      return state;
  }
};

const localization = (state = initialLocalization, action) => {
  switch (action.type) {
    case ActionTypes.CHANGE_LANGUAGE:
      return { ...state, selectedLanguage: action.newData };
    case ActionTypes.UPDATE_LOCALIZATION:
      return {
        ...state,
        languages: action.languages,
        translations: action.translations,
      };
    default:
      return state;
  }
};

export const rootReducer = combineReducers({
  appContext,
  userState,
  networkState,
  cachedState,
  communication,
  localization,
});
