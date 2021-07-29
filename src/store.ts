import {
  CombinedState,
  combineReducers,
  configureStore,
  getDefaultMiddleware,
} from '@reduxjs/toolkit';

import {
  persistReducer,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import AsyncStorage from '@react-native-async-storage/async-storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import authReducer from './features/authentication/authSlice';
import notesReducer from './features/notes/notesSlice';
import postsReducer from './features/posts/postsSlice';
import commentsReducer from './features/comments/commentsSlice';
import merchantsReducer from './features/merchants/merchantsSlice';
import productsReducer from './features/products/productsSlice';
import profilesReducer from './features/profiles/profilesSlice';
import settingsReducer from './features/settings/settingsSlice';

import { AuthState } from './features/authentication/authSlice';
import { NotesState } from './features/notes/notesSlice';
import { PostsState } from './features/posts/postsSlice';
import { CommentsState } from './features/comments/commentsSlice';
import { MerchantsState } from './features/merchants/merchantsSlice';
import { ProductsState } from './features/products/productsSlice';
import { ProfilesState } from './features/profiles/profilesSlice';
import { SettingsState } from './features/settings/settingsSlice';

type AppState = {
  auth: AuthState;
  comments: CommentsState;
  merchants: MerchantsState;
  notes: NotesState;
  posts: PostsState;
  products: ProductsState;
  profiles: ProfilesState;
  settings: SettingsState;
};

type CombinedAppState = CombinedState<AppState>;

const rootReducer = combineReducers<AppState>({
  auth: authReducer,
  comments: commentsReducer,
  merchants: merchantsReducer,
  notes: notesReducer,
  posts: postsReducer,
  products: productsReducer,
  profiles: profilesReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer<CombinedAppState>(
  {
    key: 'root',
    storage: AsyncStorage,
    stateReconciler: autoMergeLevel2,
    blacklist: ['comments', 'merchants', 'products'],
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
