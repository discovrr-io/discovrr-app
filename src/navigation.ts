import { NavigatorScreenParams } from '@react-navigation/native';

import {
  createStackNavigator,
  StackNavigationProp,
  StackScreenProps,
} from '@react-navigation/stack';

import {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';

import {
  DrawerNavigationProp,
  DrawerScreenProps,
} from '@react-navigation/drawer';

import {
  MaterialTopTabNavigationProp,
  MaterialTopTabScreenProps,
} from '@react-navigation/material-top-tabs';

import { PostId, ProductId, Profile, ProfileId } from './models';
import { InAppWebViewNavigationScreenParams } from './features/authentication/InAppWebViewScreen';
import { CreateItemPreviewNavigationScreenParams } from './features/create/CreateItemPreviewScreen';

declare global {
  namespace ReactNavigation {
    type AppParamList = RootStackParamList;
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends AppParamList {}
  }
}

//#region ROOT STACK

export type RootStackParamList = {
  // -- Authentication --
  AuthPrompt: NavigatorScreenParams<AuthPromptStackParamList>;
  // -- Top Level --
  Main: NavigatorScreenParams<MainDrawerParamList>;
  Create: NavigatorScreenParams<CreateItemStackParamList>;
  // -- Post Screens --
  PostDetails: PostStackParamList['PostDetails'];
  EditPost: PostStackParamList['EditPost'];
  // -- Profile Screens --
  ProfileDetails: ProfileStackParamList['ProfileDetails'];
  ProfileFollowActivity: ProfileStackParamList['ProfileFollowActivity'];
  // -- Product Screens --
  ProductDetails: ProductStackParamList['ProductDetails'];
  EditProduct: undefined;
  // -- Drawer Navigators --
  Notifications: undefined;
  MyShopping: undefined;
  Saved: undefined;
  // -- Settings Screens --
  MainSettings: SettingsStackParamList['MainSettings'];
  ProfileSettings: SettingsStackParamList['ProfileSettings'];
  AccountTypeSettings: SettingsStackParamList['AccountTypeSettings'];
  NotificationSettings: SettingsStackParamList['NotificationSettings'];
  AppearanceSettings: SettingsStackParamList['AppearanceSettings'];
  // -- Miscellaneous --
  ReportItem: NavigatorScreenParams<ReportItemStackParamList>;
  InAppWebView: InAppWebViewNavigationScreenParams;
  RouteError: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Main'
>;

export type RootStackScreenProps<K extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, K>;

export const RootStack = createStackNavigator<RootStackParamList>();

//#endregion

//#region AUTH PROMPT STACK

export type AuthPromptStackParamList = {
  AuthStart: { redirected: boolean } | undefined;
  Login: { profileDetails: Pick<Profile, 'avatar' | '__publicName' | 'email'> };
  Register: { email: string } | undefined;
  ForgotPassword: { email: string } | undefined;
  TermsAndConditions: undefined;
};

export type AuthPromptStackNavigationPrompt = StackNavigationProp<
  AuthPromptStackParamList,
  'AuthStart'
>;

export type AuthPromptStackScreenProps<
  K extends keyof AuthPromptStackParamList,
> = StackScreenProps<AuthPromptStackParamList, K>;

//#endregion AUTH PROMPT STACK

//#region MAIN DRAWER

export type MainDrawerParamList = {
  Facade: NavigatorScreenParams<FacadeBottomTabParamList>;
};

export type MainDrawerNavigationProp = DrawerNavigationProp<
  MainDrawerParamList,
  'Facade'
>;

export type MainDrawerScreenProps<K extends keyof MainDrawerParamList> =
  DrawerScreenProps<MainDrawerParamList, K>;

//#endregion

//#region FACADE BOTTOM TAB

export type FacadeBottomTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Notifications: undefined;
  // -- Placeholder Tabs --
  __Create: undefined;
  __MyProfile: ProfileStackParamList['ProfileDetails'];
};

export type FacadeBottomTabNavigationProp = BottomTabNavigationProp<
  FacadeBottomTabParamList,
  'Home'
>;

export type FacadeBottomTabScreenProps<
  K extends keyof FacadeBottomTabParamList,
> = BottomTabScreenProps<FacadeBottomTabParamList, K>;

//#endregion

//#region HOME STACK

export type HomeStackParamList = {
  Landing: undefined;
  Filter: undefined;
  /** TEMPORARY */
  __Search: NavigatorScreenParams<SearchStackParamList>;
};

export type HomeStackNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'Landing'
>;

export type HomeStackScreenProps<K extends keyof HomeStackParamList> =
  StackScreenProps<HomeStackParamList, K>;

//#endregion HOME STACK

//#region EXPLORE STACK

export type ExploreStackParamList = {
  Feed: NavigatorScreenParams<FeedTopTabParamList>;
  Search: NavigatorScreenParams<SearchStackParamList>;
};

export type ExploreStackNavigationProp = StackNavigationProp<
  ExploreStackParamList,
  'Feed'
>;

export type ExploreStackScreenProps<K extends keyof ExploreStackParamList> =
  StackScreenProps<ExploreStackParamList, K>;

//#endregion EXPLORE STACK

//#region FEED TOP TAB

export type FeedTopTabParamList = {
  DiscoverFeed: undefined;
  NearMeFeed:
    | { latitude: number; longitude: number; searchRadius?: number }
    | undefined;
  FollowingFeed: undefined;
};

export type FeedTopTabNavigationProp = MaterialTopTabNavigationProp<
  FeedTopTabParamList,
  'DiscoverFeed'
>;

export type FeedTopTabScreenProps<K extends keyof FeedTopTabParamList> =
  MaterialTopTabScreenProps<FeedTopTabParamList, K>;

//#endregion

//#region SEARCH STACK

export type SearchStackParamList = {
  SearchQuery: { query: string } | undefined;
  SearchResults: { query: string };
};

export type SearchStackNavigationProp = StackNavigationProp<
  SearchStackParamList,
  'SearchQuery'
>;

export type SearchStackScreenProps<K extends keyof SearchStackParamList> =
  StackScreenProps<SearchStackParamList, K>;

//#endregion SEARCH STACK

//#region SEARCH RESULTS TOP TAB

export const SearchResultsTopTabNames = [
  'SearchResultsUsers',
  'SearchResultsMakers',
  'SearchResultsProducts',
  'SearchResultsWorkshops',
  'SearchResultsPosts',
  'SearchResultsHashtags',
] as const;

type SearchResultsTopTabKeyUnion = typeof SearchResultsTopTabNames[number];

export type SearchResultsTopTabParamList = Record<
  SearchResultsTopTabKeyUnion,
  undefined
>;

export type SearchResultsTopTabNavigationProp = StackNavigationProp<
  SearchResultsTopTabParamList,
  'SearchResultsUsers'
>;

export type SearchResultsTopTabScreenProps<
  K extends keyof SearchResultsTopTabParamList,
> = StackScreenProps<SearchResultsTopTabParamList, K>;

//#endregion SEARCH RESULTS TOP TAB

//#region CREATE ITEM STACK

export type CreateItemStackParamList = {
  CreateItemDetails: NavigatorScreenParams<CreateItemDetailsTopTabParamList>;
  CreateItemPreview: CreateItemPreviewNavigationScreenParams;
};

export type CreateItemStackNavigationProp = StackNavigationProp<
  CreateItemStackParamList,
  'CreateItemDetails'
>;

export type CreateItemStackScreenProps<
  K extends keyof CreateItemStackParamList,
> = StackScreenProps<CreateItemStackParamList, K>;

//#endregion CREATE ITEM STACK

//#region CREATE ITEM DETAILS TOP TAB

export type CreateItemDetailsTopTabParamList = {
  CreateTextPost: undefined;
  CreateGalleryPost: undefined;
  CreateVideoPost: undefined;
  CreateProduct:
    | { tags: string[]; categories: string[]; location?: string }
    | undefined;
  CreateWorkshop: undefined;
};

export type CreateItemDetailsTopTabNavigationProp =
  MaterialTopTabNavigationProp<
    CreateItemDetailsTopTabParamList,
    'CreateTextPost'
  >;

export type CreateItemDetailsTopTabScreenProps<
  K extends keyof CreateItemDetailsTopTabParamList,
> = MaterialTopTabScreenProps<CreateItemDetailsTopTabParamList, K>;

//#endregion CREATE ITEM DETAILS TOP TAB

//#region POST STACK

export type PostStackParamList = {
  PostDetails: { postId: PostId; focusCommentBox?: boolean };
  EditPost: { postId: PostId };
};

//#endregion POST STACK

//#region PROFILE STACK

export type ProfileStackParamList = {
  ProfileDetails: {
    /**
     * Either a string representing the ID of the profile (typically a mix of
     * letters and digits), or a username (*MUST* be preceded by a `'@'`).
     */
    profileIdOrUsername: ProfileId | string;
    windowHeight?: number;
  };
  ProfileFollowActivity: {
    profileId: ProfileId;
    selector: 'followers' | 'following';
  };
};

//#endregion PROFILE STACK

//#region PRODUCT STACK

export type ProductStackParamList = {
  ProductDetails: { productId: ProductId; productName?: string };
};

//#endregion PRODUCT STACK

//#region SETTINGS STACK

export type SettingsStackParamList = {
  MainSettings: undefined;
  ProfileSettings: undefined;
  AccountTypeSettings: undefined;
  NotificationSettings: undefined;
  AppearanceSettings: undefined;
};

export type SettingsStackNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'MainSettings'
>;

//#endregion SETTINGS STACK

//#region REPORT ITEM STACK

export type ReportItemStackParamList = {
  ReportItemReason: { type: 'comment' | 'post' | 'profile' };
  ReportItemSuccess: undefined;
};

export type ReportItemStackNavigationProp = StackNavigationProp<
  ReportItemStackParamList,
  'ReportItemReason'
>;

export type ReportItemStackScreenParams<
  K extends keyof ReportItemStackParamList,
> = StackScreenProps<ReportItemStackParamList, K>;

//#endregion REPORT ITEM STACK
