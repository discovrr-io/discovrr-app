import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { color, font, layout } from 'src/constants';
import { PostItemCardPreview } from 'src/features/posts/PostItemCard';
import { useMyProfileId } from 'src/features/profiles/hooks';
import { useAppSelector } from 'src/hooks';
import { Profile } from 'src/models';
import { PostContents } from 'src/models/post';
import { CreateItemStackScreenProps } from 'src/navigation';

import AttachLocationButton from './AttachLocationButton';

export type CreateItemPreviewNavigationScreenParams = PostContents;

type CreateItemPreviewScreenProps =
  CreateItemStackScreenProps<'CreateItemPreview'>;

export default function CreateItemPreviewScreen(
  props: CreateItemPreviewScreenProps,
) {
  const myProfileId = useMyProfileId();
  const myProfileDetails: Pick<Profile, 'displayName' | 'avatar'> =
    useAppSelector(state => {
      if (!myProfileId) return { displayName: 'My Name' };
      return state.profiles.entities[myProfileId] ?? { displayName: 'My Name' };
    });

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          paddingHorizontal: layout.spacing.xl,
          paddingVertical: layout.spacing.lg,
        },
      ]}>
      <Text style={[font.medium, { color: color.gray700 }]}>
        Here&apos;s a preview of what your {props.route.params.type} post will
        look like to others:
      </Text>
      <View
        style={{
          alignContent: 'center',
          paddingVertical: layout.spacing.lg,
          paddingHorizontal: layout.spacing.lg,
        }}>
        <PostItemCardPreview
          contents={props.route.params}
          author={myProfileDetails}
        />
      </View>
      <AttachLocationButton />
    </SafeAreaView>
  );
}
