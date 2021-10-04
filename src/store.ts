import {
  CombinedState,
  combineReducers,
  configureStore,
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
import commentRepliesReducer from './features/comments/commentRepliesSlice';
import commentsReducer from './features/comments/commentsSlice';
import merchantsReducer from './features/merchants/merchantsSlice';
import notesReducer from './features/notes/notesSlice';
import notificationsReducer from './features/notifications/notificationsSlice';
import postsReducer from './features/posts/postsSlice';
import productsReducer from './features/products/productsSlice';
import profilesReducer from './features/profiles/profilesSlice';
import settingsReducer from './features/settings/settingsSlice';

import { AuthState } from './features/authentication/authSlice';
import { CommentRepliesState } from './features/comments/commentRepliesSlice';
import { CommentsState } from './features/comments/commentsSlice';
import { MerchantsState } from './features/merchants/merchantsSlice';
import { NotesState } from './features/notes/notesSlice';
import { NotificationsState } from './features/notifications/notificationsSlice';
import { PostsState } from './features/posts/postsSlice';
import { ProductsState } from './features/products/productsSlice';
import { ProfilesState } from './features/profiles/profilesSlice';
import { SettingsState } from './features/settings/settingsSlice';

type AppState = {
  auth: AuthState;
  comments: CommentsState;
  commentReplies: CommentRepliesState;
  merchants: MerchantsState;
  notes: NotesState;
  notifications: NotificationsState;
  posts: PostsState;
  products: ProductsState;
  profiles: ProfilesState;
  settings: SettingsState;
};

type CombinedAppState = CombinedState<AppState>;

export const rootReducer = combineReducers<AppState>({
  auth: authReducer,
  comments: commentsReducer,
  commentReplies: commentRepliesReducer,
  merchants: merchantsReducer,
  notes: notesReducer,
  notifications: notificationsReducer,
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
    blacklist: ['comments', 'commentReplies', 'merchants', 'products'],
  },
  rootReducer,
);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Note: Uncomment below if TypeScript doesn't infer `AppDispatch` properly
// import { Action, AnyAction, Dispatch, ThunkDispatch } from '@reduxjs/toolkit';
// export type AppDispatch = ThunkDispatch<any, null, AnyAction> &
//   ThunkDispatch<any, undefined, AnyAction> &
//   Dispatch<Action<any>>;

export default store;
