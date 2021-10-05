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

import { NoteId, PostId, ProfileId } from './models';

declare global {
  namespace ReactNavigation {
    type AppParamList = AuthStackParamList & RootStackParamList;
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends AppParamList {}
  }
}

//#region AUTH STACK

export type AuthStackParamList = {
  Auth: { action: 'login' | 'register' | 'forgot-password' } | undefined;
  TermsAndConditions: undefined;
};

export type AuthStackNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Auth'
>;

export type AuthStackScreenProps<K extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, K>;

//#endregion AUTH STACK

//#region ROOT STACK

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainDrawerParamList>;
  Create: NavigatorScreenParams<CreateItemStackParamList>;
  // -- Post Screens --
  PostDetails: PostStackParamList['PostDetails'];
  EditPost: PostStackParamList['EditPost'];
  // -- Note Screens --
  NoteDetails: NoteStackParamList['NoteDetails'];
  EditNote: NoteStackParamList['EditNote'];
  // -- Profile Screens --
  ProfileDetails: ProfileStackParamList['ProfileDetails'];
  ProfileFollowActivity: ProfileStackParamList['ProfileFollowActivity'];
  // -- Product Screens --
  ProductDetails: undefined;
  EditProduct: undefined;
  // -- Drawer Navigators --
  Notifications: undefined;
  MyShopping: undefined;
  Saved: undefined;
  // -- Settings Screens --
  MainSettings: SettingsStackParamList['MainSettings'];
  ProfileSettings: SettingsStackParamList['ProfileSettings'];
  LocationAccuracySettings: SettingsStackParamList['LocationAccuracySettings'];
  NotificationSettings: SettingsStackParamList['NotificationSettings'];
  // -- Miscellaneous --
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
  Feed: NavigatorScreenParams<FeedTopTabParamList>;
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
  Masthead: undefined;
  Filter: undefined;
};

export type HomeStackNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'Masthead'
>;

export type HomeStackScreenProps<K extends keyof HomeStackParamList> =
  StackScreenProps<HomeStackParamList, K>;

//#endregion HOME STACK

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

//#region CREATE ITEM STACK

export type CreateItemStackParamList = {
  CreateItemDetails: NavigatorScreenParams<CreateItemDetailsTopTabParamList>;
  CreateItemPreview: undefined;
};

export type CreateItemStackNavigationProp = StackNavigationProp<
  CreateItemStackParamList,
  'CreateItemDetails'
>;

export type CreateItemStackScreenProps<
  K extends keyof CreateItemStackParamList,
> = StackScreenProps<CreateItemStackParamList, K>;

//#endregion

//#region CREATE ITEM DETAILS TOP TAB

export type CreateItemDetailsTopTabParamList = {
  Text: undefined;
  Gallery: undefined;
  Video: undefined;
  // Product: undefined;
  // Workshop: undefined;
};

export type CreateItemDetailsTopTabNavigationProp =
  MaterialTopTabNavigationProp<CreateItemDetailsTopTabParamList, 'Text'>;

export type CreateItemDetailsTopTabScreenProps<
  K extends keyof CreateItemDetailsTopTabParamList,
> = MaterialTopTabScreenProps<CreateItemDetailsTopTabParamList, K>;

//#endregion

//#region POST STACK

export type PostStackParamList = {
  PostDetails: { postId: PostId };
  EditPost: { postId: PostId };
};

export type PostStackNavigationProp = StackNavigationProp<
  PostStackParamList,
  'PostDetails'
>;

export type PostStackScreenProps<K extends keyof PostStackParamList> =
  StackScreenProps<PostStackParamList, K>;

//#endregion

//#region NOTE STACK

export type NoteStackParamList = {
  NoteDetails: { noteId: NoteId; noteTitle?: string };
  EditNote: { noteId: NoteId; noteTitle?: string };
};

export type NoteStackNavigationProp = StackNavigationProp<
  NoteStackParamList,
  'NoteDetails'
>;

export type NoteStackScreenProps<K extends keyof NoteStackParamList> =
  StackScreenProps<NoteStackParamList, K>;

//#endregion

//#region PROFILE STACK

export type ProfileStackParamList = {
  ProfileDetails: {
    profileId: ProfileId;
    profileDisplayName?: string;
    hideHeader?: boolean;
  };
  ProfileFollowActivity: {
    profileId: ProfileId;
    selector: 'followers' | 'following';
    profileDisplayName?: string;
  };
};

export type ProfileStackNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'ProfileDetails'
>;

export type ProfileStackScreenProps<K extends keyof ProfileStackParamList> =
  StackScreenProps<ProfileStackParamList, K>;

//#endregion

//#region SETTINGS STACK

export type SettingsStackParamList = {
  MainSettings: undefined;
  ProfileSettings: undefined;
  NotificationSettings: undefined;
  LocationAccuracySettings: undefined;
};

export type SettingsStackNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'MainSettings'
>;

export type SettingsStackScreenProps<K extends keyof SettingsStackParamList> =
  StackScreenProps<SettingsStackParamList, K>;

//#endregion

/*

App = Auth | Root

AuthStack = Stack {
  AuthScreen
  TermsAndConditionsScreen
}

Root = Stack {
  Main = Drawer {
    Facade = BottomTab {
      Home = Stack {
        Masthead
        Filter
      }
      Feed = TopTab {
        Discover
        NearMe
        Following
      }
      Notifications
      __Create
      __MyProfile
    }
  }
  Create = Stack {
    CreateDetails = TopTab {
      Text
      Gallery
      Video
      // Product
      // Workshop
    }
    CreatePreview
  }
  // -- Item Navigators --
  (Post) = Group {
    PostDetails
    EditPost
  }
  (Note) = Group {
    NoteDetails
    EditNote
  }
  (Profile) = Group {
    ProfileDetails
    ProfileFollowActivity
    // EditProfile
    // ReportProfile
  }
  (Product) = Group {
    ProductDetails
    EditProduct
  }
  // -- Drawer Navigators --
  MyShopping
  Saved
  (Settings) = Group {
    MainSettings
    AccountSettings
    LocationSettings
    NotificationSettings
  }
  // -- Miscellaneous --
  RouteError
}

*/
