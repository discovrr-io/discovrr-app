import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/core';

import { MediaSource } from 'src/api';
import { color, font, layout } from 'src/constants';
import { DEFAULT_IMAGE_DIMENSIONS } from 'src/constants/media';
import { Post, PostId, Profile, ProfileId } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';

import { AsyncGate, Card, PlayButton } from 'src/components';
import { CardActionsProps } from 'src/components/cards/CardActions';
import { CardAuthorProps } from 'src/components/cards/CardAuthor';
import { useCardElementOptionsContext } from 'src/components/cards/hooks';

import {
  CardElementOptions,
  CardElementProps,
} from 'src/components/cards/common';

import {
  alertSomethingWentWrong,
  generateRandomNumberBetween,
  shortenLargeNumber,
} from 'src/utilities';

import { useIsMyProfile, useProfile } from 'src/features/profiles/hooks';
import { useAppDispatch, useOverridableContextOptions } from 'src/hooks';

import { usePost } from './hooks';
import { updatePostLikeStatus } from './posts-slice';
import { Statistics } from 'src/models/common';
import {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const ASPECT_RATIOS = [
  1 / 1, // 1:1 (Square)
  4 / 5, // 4:5 (Portrait Short)
  2 / 3, // 2:3 (Portrait Tall)
];

type PostItemCardContext = {
  showMenuIcon?: boolean;
  showShareIcon?: boolean;
  onPressMenu?: (post: Post) => void | Promise<void>;
  onPressShare?: (post: Post) => void | Promise<void>;
};

export const PostItemCardContext = React.createContext<PostItemCardContext>({});

type PreferredMediaAspectRatio = {
  preferredMediaAspectRatio?: number;
};

//#region PostItemCard ---------------------------------------------------------

type PostItemCardProps = CardElementProps &
  PostItemCardContext & {
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
    <PostItemCardContext.Provider
      value={{ showMenuIcon, showShareIcon, onPressMenu, onPressShare }}>
      <AsyncGate
        data={postData}
        onPending={() => <InnerPostItemCard.Pending {...cardElementProps} />}
        onFulfilled={post => {
          if (!post) return null;
          return <InnerPostItemCard post={post} {...cardElementProps} />;
        }}
      />
    </PostItemCardContext.Provider>
  );
}

//#endregion PostItemCard

//#region InnerPostItemCard ----------------------------------------------------

type InnerPostItemCardProps = CardElementProps & {
  post: Post;
};

export const InnerPostItemCard = (props: InnerPostItemCardProps) => {
  const { post, ...cardElementProps } = props;
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressPost = () => {
    navigation.push('PostDetails', { postId: post.id });
  };

  return (
    <Card {...cardElementProps}>
      <Card.Body onPress={handlePressPost}>
        {elementOptions => <PostItemCardBody {...elementOptions} body={post} />}
      </Card.Body>
      <PostItemCardFooter post={post} />
    </Card>
  );
};

// eslint-disable-next-line react/display-name
InnerPostItemCard.Pending = (props: CardElementProps) => {
  const aspectRatioIndex = generateRandomNumberBetween(0, ASPECT_RATIOS.length);
  return (
    <Card {...props}>
      <Card.Body
        style={[
          postItemCardStyles.cardBodyPlaceholder,
          { width: '100%', aspectRatio: ASPECT_RATIOS[aspectRatioIndex] },
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

//#endregion InnerPostItemCard

//#region PostItemCardBody -----------------------------------------------------

type PostItemCardBodyProps = CardElementOptions &
  PreferredMediaAspectRatio & {
    body: Pick<Post, 'contents' | 'statistics'>;
  };

function PostItemCardBody(props: PostItemCardBodyProps) {
  const { body, ...cardElementProps } = props;

  switch (body.contents.type) {
    case 'gallery':
      return (
        <PostItemCardBodyImageGallery
          {...body.contents}
          statistics={body.statistics}
        />
      );
    case 'video':
      return (
        <PostItemCardBodyVideoThumbnailProps
          {...body.contents}
          statistics={body.statistics}
          preferredMediaAspectRatio={props.preferredMediaAspectRatio}
        />
      );
    case 'text':
      return (
        <View
          style={{
            paddingVertical: cardElementProps.insetVertical,
            paddingHorizontal: cardElementProps.insetHorizontal,
          }}>
          <Text
            numberOfLines={cardElementProps.smallContent ? 4 : 8}
            style={
              cardElementProps.smallContent ? font.medium : font.extraLarge
            }>
            {body.contents.text}
          </Text>
        </View>
      );
  }
}

type PostItemCardBodyImageGalleryProps = {
  sources: MediaSource[];
  caption: string;
  statistics: Statistics;
};

function PostItemCardBodyImageGallery(
  props: PostItemCardBodyImageGalleryProps,
) {
  const { sources, caption, statistics } = props;
  const elementOptions = useCardElementOptionsContext();
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
        {statistics.totalViews > 1 && (
          <Card.Indicator
            iconName="eye"
            position="bottom-left"
            label={shortenLargeNumber(statistics.totalViews)}
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
}

type PostItemCardBodyVideoThumbnailProps = PreferredMediaAspectRatio & {
  source: MediaSource;
  thumbnail?: MediaSource;
  caption: string;
  statistics: Statistics;
};

function PostItemCardBodyVideoThumbnailProps(
  props: PostItemCardBodyVideoThumbnailProps,
) {
  const { source, thumbnail, caption, statistics, preferredMediaAspectRatio } =
    props;

  const elementOptions = useCardElementOptionsContext();
  const [viewWidth, setViewWidth] = React.useState(0);

  return (
    <View onLayout={e => setViewWidth(e.nativeEvent.layout.width)}>
      <View>
        {statistics.totalViews > 1 && (
          <Card.Indicator
            iconName="eye"
            position="bottom-left"
            label={shortenLargeNumber(statistics.totalViews)}
            elementOptions={elementOptions}
          />
        )}
        <View
          style={{
            maxHeight: preferredMediaAspectRatio
              ? viewWidth / preferredMediaAspectRatio
              : undefined,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
          {thumbnail ? (
            <>
              <FastImage
                source={{ uri: thumbnail.url }}
                style={{
                  width: '100%',
                  aspectRatio: (thumbnail.width ?? 1) / (thumbnail.height ?? 1),
                  backgroundColor: color.placeholder,
                }}
              />
              <PlayButton
                smallContent={elementOptions.smallContent}
                style={{ opacity: 0.5 }}
              />
            </>
          ) : (
            <PostItemCardBodyVideoPreview source={source} />
          )}
        </View>
      </View>
      <PostItemCardCaption caption={caption} />
    </View>
  );
}

type PostItemCardBodyVideoPreviewProps = Pick<
  PostItemCardBodyVideoThumbnailProps,
  'source'
>;

function PostItemCardBodyVideoPreview(
  props: PostItemCardBodyVideoPreviewProps,
) {
  const source = props.source;
  const elementOptions = useCardElementOptionsContext();

  const [isPreviewLoaded, setIsPreviewLoaded] = React.useState(false);
  const [isPreviewFinished, setIsPreviewFinished] = React.useState(false);

  const playButtonOpacity = useSharedValue(0);
  const playButtonStyle = useAnimatedStyle(() => ({
    opacity: playButtonOpacity.value,
  }));

  useDerivedValue(() => {
    if (playButtonOpacity.value) {
      runOnJS(setIsPreviewFinished)(true);
    }
  });

  React.useEffect(() => {
    if (isPreviewLoaded) {
      // Wait for 3 seconds before fading in the play button
      playButtonOpacity.value = withDelay(3 * 1000, withTiming(1));
    }
  }, [isPreviewLoaded, playButtonOpacity]);

  return (
    <View>
      <Video
        muted
        playWhenInactive
        paused={isPreviewFinished}
        onLoadStart={() => setIsPreviewLoaded(false)}
        onReadyForDisplay={() => setIsPreviewLoaded(true)}
        resizeMode="cover"
        source={{ uri: source.url, type: source.type }}
        style={{
          width: '100%',
          aspectRatio: (source.width ?? 1) / (source.height ?? 1),
          backgroundColor: color.placeholder,
        }}
      />
      <PlayButton
        smallContent={elementOptions.smallContent}
        style={playButtonStyle}
      />
    </View>
  );
}

//#endregion PostItemCardBody

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
  Partial<PostItemCardContext> & {
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
  Partial<PostItemCardContext> & {
    post: Post;
  };

function PostItemCardActions(props: PostItemCardActionsProps) {
  const { post, itemSpacing, elementOptions, style, ...handlersProps } = props;
  const { didLike, totalLikes } = post.statistics;

  const dispatch = useAppDispatch();
  const handlersContext = useOverridableContextOptions(
    PostItemCardContext,
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

//#region PostItemCardPreview --------------------------------------------------

// type PostItemCardPreviewProps = CardElementProps & {
//   post: Pick<Post, 'contents'> & Pick<Partial<Post>, 'statistics'>;
// };

type PostItemCardPreviewProps = CardElementProps &
  PreferredMediaAspectRatio & {
    contents: Post['contents'];
    author: CardAuthorProps;
    statistics?: Partial<Post['statistics']>;
  };

export function PostItemCardPreview(props: PostItemCardPreviewProps) {
  const {
    contents,
    author,
    statistics,
    elementOptions,
    preferredMediaAspectRatio,
    style,
  } = props;

  const newElementOptions = { ...elementOptions, disabled: true };

  return (
    <Card elementOptions={newElementOptions} style={style}>
      <Card.Body elementOptions={{ disabled: true }}>
        {elementOptions => (
          <PostItemCardBody
            {...elementOptions}
            preferredMediaAspectRatio={preferredMediaAspectRatio}
            body={{
              contents: contents,
              statistics: {
                didLike: false,
                didSave: false,
                totalLikes: 0,
                totalViews: 0,
                ...statistics,
              },
            }}
          />
        )}
      </Card.Body>
      <Card.Footer elementOptions={newElementOptions}>
        <Card.Author {...author} />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={statistics?.didLike ?? false}
            totalLikes={statistics?.totalLikes ?? 0}
            onToggleLike={() => {}}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
}

//#endregion PostItemCardPreview

//#region Styles ---------------------------------------------------------------

const postItemCardStyles = StyleSheet.create({
  cardBodyPlaceholder: {
    width: '100%',
    backgroundColor: color.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.spacing.md,
  },
});
