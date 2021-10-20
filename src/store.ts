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
import createDebugger from 'redux-flipper';

import authReducer from './features/authentication/auth-slice';
import commentRepliesReducer from './features/comments/comment-replies-slice';
import commentsReducer from './features/comments/comments-slice';
import merchantsReducer from './features/merchants/merchants-slice';
import notificationsReducer from './features/notifications/notifications-slice';
import postsReducer from './features/posts/posts-slice';
import productsReducer from './features/products/products-slice';
import profilesReducer from './features/profiles/profiles-slice';
import searchReducer from './features/search/search-slice';
import settingsReducer from './features/settings/settings-slice';

import { AuthState } from './features/authentication/auth-slice';
import { CommentRepliesState } from './features/comments/comment-replies-slice';
import { CommentsState } from './features/comments/comments-slice';
import { MerchantsState } from './features/merchants/merchants-slice';
import { NotificationsState } from './features/notifications/notifications-slice';
import { PostsState } from './features/posts/posts-slice';
import { ProductsState } from './features/products/products-slice';
import { ProfilesState } from './features/profiles/profiles-slice';
import { SearchState } from './features/search/search-slice';
import { SettingsState } from './features/settings/settings-slice';

type AppState = {
  auth: AuthState;
  comments: CommentsState;
  commentReplies: CommentRepliesState;
  merchants: MerchantsState;
  notifications: NotificationsState;
  posts: PostsState;
  products: ProductsState;
  profiles: ProfilesState;
  search: SearchState;
  settings: SettingsState;
};

type CombinedAppState = CombinedState<AppState>;

export const rootReducer = combineReducers<AppState>({
  auth: authReducer,
  comments: commentsReducer,
  commentReplies: commentRepliesReducer,
  merchants: merchantsReducer,
  notifications: notificationsReducer,
  posts: postsReducer,
  products: productsReducer,
  profiles: profilesReducer,
  search: searchReducer,
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
  middleware: getDefaultMiddleware => {
    const defaultMiddleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE],
      },
    });

    if (__DEV__) {
      console.log('Attaching Redux Flipper debugger');
      return defaultMiddleware.concat(createDebugger());
    }

    return defaultMiddleware;
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Note: Uncomment below if TypeScript doesn't infer `AppDispatch` properly
// import { Action, AnyAction, Dispatch, ThunkDispatch } from '@reduxjs/toolkit';
// export type AppDispatch = ThunkDispatch<any, null, AnyAction> &
//   ThunkDispatch<any, undefined, AnyAction> &
//   Dispatch<Action<any>>;

export default store;
