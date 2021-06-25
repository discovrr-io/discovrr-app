import {
  combineReducers,
  configureStore,
  getDefaultMiddleware,
} from '@reduxjs/toolkit';

import AsyncStorage from '@react-native-community/async-storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import {
  persistReducer,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import authReducer from './features/authentication/authSlice';
import commentsReducer from './features/comments/commentsSlice';
import postsReducer from './features/posts/postsSlice';
import profilesReducer from './features/profiles/profilesSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  comments: commentsReducer,
  posts: postsReducer,
  profiles: profilesReducer,
});

const persistedReducer = persistReducer(
  {
    storage: AsyncStorage,
    key: 'root',
    stateReconciler: autoMergeLevel2,
    // blacklist: ['posts', 'profiles'],
    blacklist: ['comments'],
  },
  rootReducer,
);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE],
    },
  }),
});

export default store;
