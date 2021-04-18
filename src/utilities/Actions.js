import * as ActionTypes from './ActionTypes';

const Parse = require('parse/react-native');

export const saveCredentials = (newData) => ({ type: ActionTypes.SAVE_CREDENTIALS, newData });

export const saveLeftDrawerContext = (context) => ({ type: ActionTypes.SAVE_LEFT_DRAWER_CONTEXT, context });

export const login = (payload) => ({ type: ActionTypes.LOG_IN_SUCCEEDED, payload });

export const logout = () => ({ type: ActionTypes.LOG_OUT });

export const updateConfigData = (newData) => ({ type: ActionTypes.UPDATE_CONFIG_DATA, newData });

export const changeLanguage = (newData) => ({ type: ActionTypes.CHANGE_LANGUAGE, newData });

export const updateLocalization = (languages, translations) => ({ type: ActionTypes.UPDATE_LOCALIZATION, languages, translations });

export const forcedEjection = async (navigate) => {
  Parse.User.logOut().catch(() => {});
  navigate('Auth');
  return ({ type: ActionTypes.FORCED_EJECTION });
};

export const clearBiometrics = () => ({ type: ActionTypes.CLEAR_BIOMETRICS });

export const saveLocationPreference = (payload) => ({ type: ActionTypes.SAVE_LOCATION_PREFERENCE, payload });

export const updateProfile = (payload) => ({ type: ActionTypes.UPDATE_PROFILE, payload });

export const updateNotes = (payload) => ({ type: ActionTypes.UPDATE_NOTES, payload });

export const updatePosts = (payload) => ({ type: ActionTypes.UPDATE_POSTS, payload });

export const updateUserPosts = (payload) => ({ type: ActionTypes.UPDATE_USER_POSTS, payload });

export const updateLikedPosts = (payload) => ({ type: ActionTypes.UPDATE_LIKED_POSTS, payload });

export const updateNearMePosts = (payload) => ({ type: ActionTypes.UPDATE_NEAR_ME_POSTS, payload });

export const updateFollowingPosts = (payload) => ({ type: ActionTypes.UPDATE_FOLLOWING_POSTS, payload });

export const updateComments = (selector, payload) => ({ type: ActionTypes.UPDATE_COMMENTS, selector, payload });

export const updateFollowing = (payload) => ({ type: ActionTypes.UPDATE_FOLLOWING, payload });

export const updatePinnedPosts = (payload) => ({ type: ActionTypes.UPDATE_PINNED_POSTS, payload });

export const updateBlockedProfiles = (payload) => ({ type: ActionTypes.UPDATE_BLOCKED_PROFILES, payload });
