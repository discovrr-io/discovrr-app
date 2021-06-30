import React from 'react';
import { RefreshControl, SafeAreaView, Text, View } from 'react-native';

import { Tabs } from 'react-native-collapsible-tab-view';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import PostMasonryList from '../../components/masonry/PostMasonryList';
import { EmptyTabView } from '../../components';
import { ProfileScreenHeader } from '../profiles/ProfileScreen';
import { selectPostsByProfile } from '../posts/postsSlice';
import { selectAllNotes } from '../notes/notesSlice';
import NoteMasonryList from '../../components/masonry/NoteMasonryList';

/**
 * @typedef {import('../../models').Merchant} Merchant
 * @typedef {{ merchant: Merchant }} MerchantProfileScreenProps
 * @param {MerchantProfileScreenProps} param0
 */
export default function MerchantProfileScreen() {
  /** @type {{ merchant: Merchant }} */
  const { merchant } = useRoute().params ?? {};

  const profileId = merchant.profileId;
  const postIds = profileId
    ? useSelector((state) =>
        selectPostsByProfile(state, profileId).map((post) => post.id),
      )
    : [];

  const noteIds = profileId
    ? useSelector((state) => {
        const allNotes = selectAllNotes(state);
        return allNotes
          .filter((note) => note.isPublic && note.profileId === profileId)
          .map((note) => note.id);
      })
    : [];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs.Container
        lazy
        snapThreshold={0.25}
        HeaderComponent={() => (
          <ProfileScreenHeader
            profileDetails={{
              ...merchant,
              fullName: merchant.shortName,
              isVendor: true,
            }}
          />
        )}>
        <Tabs.Tab name="posts" label="Posts">
          <Tabs.ScrollView /* refreshControl={<RefreshControl />} */>
            <PostMasonryList
              smallContent
              showFooter={false}
              postIds={postIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={`Looks like ${
                    merchant.shortName || 'this profile'
                  } hasn't posted anything yet`}
                />
              }
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="notes" label="Notes">
          <Tabs.ScrollView>
            <NoteMasonryList
              smallContent
              showFooter={false}
              noteIds={noteIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={`Looks like ${
                    merchant.shortName || 'this profile'
                  } hasn't shared any public notes yet`}
                />
              }
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="products" label="Products">
          <Tabs.ScrollView>
            <EmptyTabView
              message={`Looks like ${
                merchant.shortName || 'this profile'
              } doesn't have any products yet`}
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
    </SafeAreaView>
  );
}
