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
import nearMeReducer from './features/nearMe/nearMeSlice';
import notesReducer from './features/notes/notesSlice';
import postsReducer from './features/posts/postsSlice';
import productsReducer from './features/products/productsSlice';
import profilesReducer from './features/profiles/profilesSlice';
import settingsReducer from './features/settings/settingsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  comments: commentsReducer,
  nearMe: nearMeReducer,
  notes: notesReducer,
  posts: postsReducer,
  products: productsReducer,
  profiles: profilesReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer(
  {
    key: 'root',
    storage: AsyncStorage,
    stateReconciler: autoMergeLevel2,
    blacklist: ['comments', 'products'],
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
