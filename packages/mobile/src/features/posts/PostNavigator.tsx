import * as React from 'react';

import PostDetailsScreen from './PostDetailsScreen';
import { PlaceholderScreen } from 'src/components';
import { RootStack } from 'src/navigation';

export default function renderPostNavigator() {
  return (
    <RootStack.Group>
      <RootStack.Screen
        name="PostDetails"
        component={PostDetailsScreen}
        options={{ title: 'Post' }}
      />
      <RootStack.Screen
        name="EditPost"
        component={PlaceholderScreen}
        options={{ title: 'Edit Post' }}
      />
    </RootStack.Group>
  );
}
