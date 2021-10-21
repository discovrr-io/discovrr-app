import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { useIsFocused, useNavigation } from '@react-navigation/core';

import { AsyncGate, Card } from 'src/components';
import { CardActionsProps } from 'src/components/cards/CardActions';
import { useCardElementOptionsContext } from 'src/components/cards/hooks';

import { color, font } from 'src/constants';
import { DEFAULT_IMAGE_DIMENSIONS } from 'src/constants/media';
import { RootStackNavigationProp } from 'src/navigation';

import { MediaSource } from 'src/api';
import { Post, PostId, Profile, ProfileId } from 'src/models';
import { PostType } from 'src/models/post';

import { useIsMyProfile, useProfile } from 'src/features/profiles/hooks';
import { useAppDispatch, useOverridableContextOptions } from 'src/hooks';

import {
  CardElementOptions,
  CardElementProps,
} from 'src/components/cards/common';

import {
  alertSomethingWentWrong,
  generateRandomNumberBetween,
  shortenLargeNumber,
} from 'src/utilities';

import { usePost } from './hooks';
import { updatePostLikeStatus } from './posts-slice';

const ASPECT_RATIOS = [
  1 / 1, // 1:1 (Square)
  4 / 5, // 4:5 (Portrait Short)
  2 / 3, // 2:3 (Portrait Tall)
];

const PLAY_BUTTON_SIZE_SMALL = 80;
const PLAY_BUTTON_SIZE_LARGE = 120;
const PLAY_BUTTON_COLOR = color.gray100;

type PostItemCardHandlers = {
  showMenuIcon?: boolean;
  showShareIcon?: boolean;
  onPressMenu?: (post: Post) => void | Promise<void>;
  onPressShare?: (post: Post) => void | Promise<void>;
};

export const PostItemCardHandlersContext =
  React.createContext<PostItemCardHandlers>({});

//#region PostItemCard ---------------------------------------------------------

type PostItemCardProps = CardElementProps &
  PostItemCardHandlers & {
    postId: PostId;
  };

export default function PostItemCard(props: PostItemCardProps) {
  const {
    postId,
    showMenuIcon,
    showShareIcon,
    onPressMenu,
    onPressShare,
    ...cardElementProps
  } = props;

  const postData = usePost(postId);

  return (
    <PostItemCardHandlersContext.Provider
      value={{ showMenuIcon, showShareIcon, onPressMenu, onPressShare }}>
      <AsyncGate
        data={postData}
        onPending={() => <LoadedPostItemCard.Pending {...cardElementProps} />}
        onFulfilled={post => {
          if (!post) return null;
          return <LoadedPostItemCard post={post} {...cardElementProps} />;
        }}
      />
    </PostItemCardHandlersContext.Provider>
  );
}

//#endregion PostItemCard

//#region LoadedPostItemCard ----------------------------------------------------

type LoadedPostItemCardProps = CardElementProps & {
  post: Post;
};

const LoadedPostItemCard = (props: LoadedPostItemCardProps) => {
  const { post, ...cardElementProps } = props;
  const navigation = useNavigation<RootStackNavigationProp>();
  const isFocused = useIsFocused();

  const [_isVideoPaused, setIsVideoPaused] = useState(false);

  useEffect(() => {
    setIsVideoPaused(!isFocused);
  }, [isFocused]);

  const renderImageGallery = useCallback(
    (
      sources: MediaSource[],
      caption: string,
      elementOptions: CardElementOptions,
    ) => {
      const imagePreviewSource = sources[0];
      const {
        width: imageWidth = DEFAULT_IMAGE_DIMENSIONS.height,
        height: imageHeight = DEFAULT_IMAGE_DIMENSIONS.width,
      } = imagePreviewSource;

      return (
        <View>
          <View>
            {sources.length > 1 && (
              <Card.Indicator
                iconName="images"
                position="top-right"
                label={sources.length.toString()}
                elementOptions={elementOptions}
              />
            )}
            {post.statistics.totalViews > 1 && (
              <Card.Indicator
                iconName="eye"
                position="bottom-left"
                label={shortenLargeNumber(post.statistics.totalViews)}
                elementOptions={elementOptions}
              />
            )}
            <FastImage
              resizeMode="contain"
              source={{ uri: imagePreviewSource.url }}
              style={{
                width: '100%',
                height: undefined,
                aspectRatio: imageWidth / imageHeight,
                backgroundColor: color.placeholder,
              }}
            />
          </View>
          <PostItemCardCaption caption={caption} />
        </View>
      );
    },
    [post],
  );

  const renderCardBody = useCallback(
    (elementOptions: CardElementOptions) => {
      switch (post.contents.type) {
        case PostType.GALLERY:
          return renderImageGallery(
            post.contents.sources,
            post.contents.caption,
            elementOptions,
          );
        case PostType.VIDEO:
          return (
            <View>
              <View>
                <Video
                  muted
                  repeat
                  playWhenInactive
                  resizeMode="cover"
                  // paused={isVideoPaused}
                  paused={true}
                  source={{
                    uri: post.contents.source.url,
                    type: post.contents.source.type,
                  }}
                  style={{
                    width: '100%',
                    aspectRatio:
                      (post.contents.source.height ?? 1) /
                      (post.contents.source.width ?? 1),
                    backgroundColor: color.placeholder,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#00000044',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons
                    name="play"
                    size={
                      elementOptions.smallContent
                        ? PLAY_BUTTON_SIZE_SMALL
                        : PLAY_BUTTON_SIZE_LARGE
                    }
                    color={PLAY_BUTTON_COLOR}
                  />
                </View>
              </View>
              <PostItemCardCaption caption={post.contents.caption} />
            </View>
          );
        case PostType.TEXT:
          return (
            <View
              style={{
                paddingVertical: elementOptions.insetVertical,
                paddingHorizontal: elementOptions.insetHorizontal,
              }}>
              <Text
                numberOfLines={elementOptions.smallContent ? 4 : 8}
                style={
                  elementOptions.smallContent ? font.medium : font.extraLarge
                }>
                {post.contents.text}
              </Text>
            </View>
          );
      }
    },
    [/* isVideoPaused, */ post.contents, renderImageGallery],
  );

  const handlePressPost = () => {
    navigation.push('PostDetails', { postId: post.id });
  };

  return (
    <Card {...cardElementProps}>
      <Card.Body onPress={handlePressPost}>
        {elementOptions => renderCardBody(elementOptions)}
      </Card.Body>
      <PostItemCardFooter post={post} />
    </Card>
  );
};

// eslint-disable-next-line react/display-name
LoadedPostItemCard.Pending = (props: CardElementProps) => {
  const aspectRatioIndex = generateRandomNumberBetween(0, ASPECT_RATIOS.length);
  return (
    <Card {...props}>
      <Card.Body
        style={[
          postItemCardStyles.cardBodyPlaceholder,
          { aspectRatio: ASPECT_RATIOS[aspectRatioIndex] },
        ]}>
        {elementOptions => (
          <ActivityIndicator
            color={color.gray300}
            style={{
              transform: [{ scale: elementOptions.smallContent ? 2 : 3 }],
            }}
          />
        )}
      </Card.Body>
      <PostItemCardFooter.Pending />
    </Card>
  );
};

//#endregion LoadedPostItemCard

//#region PostItemCardCaption --------------------------------------------------

type PostItemCardCaptionProps = {
  caption: string;
};

function PostItemCardCaption(props: PostItemCardCaptionProps) {
  const cardElementOptions = useCardElementOptionsContext();
  return (
    <View
      style={{
        paddingHorizontal: cardElementOptions.insetHorizontal,
        paddingVertical: cardElementOptions.insetVertical,
      }}>
      <Text numberOfLines={2} style={[cardElementOptions.captionTextStyle]}>
        {props.caption}
      </Text>
    </View>
  );
}

//#endregion PostItemCardCaption

//#region PostItemCardFooter ---------------------------------------------------

type PostItemCardFooterProps = CardElementProps &
  Partial<PostItemCardHandlers> & {
    post: Post;
  };

export const PostItemCardFooter = (props: PostItemCardFooterProps) => {
  const { post, elementOptions, style, ...handlers } = props;
  const cardElementOptions = useCardElementOptionsContext(elementOptions);

  return (
    <Card.Footer elementOptions={cardElementOptions} style={style}>
      <PostItemCardAuthor profileId={post.profileId} />
      <PostItemCardActions post={post} {...handlers} />
    </Card.Footer>
  );
};

// eslint-disable-next-line react/display-name
PostItemCardFooter.Pending = (props: CardElementProps) => (
  <Card.Footer {...props}>
    <Card.Author.Pending />
    <Card.Actions.Pending numberOfActions={1} />
  </Card.Footer>
);

//#endregion PostItemCardFooter

//#region PostItemCardAuthor ---------------------------------------------------

type PostItemCardAuthorProps = CardElementProps & {
  profileId: ProfileId;
};

function PostItemCardAuthor(props: PostItemCardAuthorProps) {
  const { profileId, ...cardElementProps } = props;
  const profileData = useProfile(profileId);
  const navigation = useNavigation<RootStackNavigationProp>();
  const isMyProfile = useIsMyProfile(props.profileId);

  const handlePressAuthor = (profile: Profile | undefined) => {
    if (!profile) {
      console.warn(`Cannot navigate to profile with ID '${profileId}'`);
      return;
    }

    navigation.navigate('ProfileDetails', {
      profileId: profile.profileId,
      profileDisplayName: profile.displayName,
    });
  };

  return (
    <AsyncGate
      data={profileData}
      onPending={() => <Card.Author.Pending {...cardElementProps} />}
      onRejected={() => (
        <Card.Author displayName="Anonymous" {...cardElementProps} />
      )}
      onFulfilled={profile => (
        <Card.Author
          avatar={profile?.avatar}
          displayName={profile?.displayName ?? 'Anonymous'}
          isMyProfile={isMyProfile}
          onPress={() => handlePressAuthor(profile)}
          {...cardElementProps}
        />
      )}
    />
  );
}

//#endregion PostItemCardAuthor

//#region PostItemCardActions --------------------------------------------------

type PostItemCardActionsProps = Omit<CardActionsProps, 'children'> &
  Partial<PostItemCardHandlers> & {
    post: Post;
  };

function PostItemCardActions(props: PostItemCardActionsProps) {
  const { post, itemSpacing, elementOptions, style, ...handlersProps } = props;
  const { didLike, totalLikes } = post.statistics;

  const dispatch = useAppDispatch();
  const handlersContext = useOverridableContextOptions(
    PostItemCardHandlersContext,
    handlersProps,
  );

  const handleToggleLike = async (didLike: boolean) => {
    try {
      const action = updatePostLikeStatus({
        postId: post.id,
        didLike,
        sendNotification: true,
      });
      await dispatch(action).unwrap();
    } catch (error) {
      alertSomethingWentWrong();
    }
  };

  return (
    <Card.Actions
      itemSpacing={itemSpacing}
      elementOptions={elementOptions}
      style={style}>
      <Card.HeartIconButton
        didLike={didLike}
        totalLikes={totalLikes}
        onToggleLike={handleToggleLike}
      />
      {handlersContext.showShareIcon && (
        <Card.IconButton
          iconName="ios-share-outline"
          onPress={() => handlersContext.onPressShare?.(post)}
        />
      )}
      {handlersContext.showMenuIcon && (
        <Card.IconButton
          iconName="ellipsis-horizontal-outline"
          onPress={() => handlersContext.onPressMenu?.(post)}
        />
      )}
    </Card.Actions>
  );
}

//#endregion PostItemCardActions

//#region Styles ---------------------------------------------------------------

const postItemCardStyles = StyleSheet.create({
  cardBodyPlaceholder: {
    width: '100%',
    backgroundColor: color.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
