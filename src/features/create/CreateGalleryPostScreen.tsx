import React, { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/core';

import { Button, PlaceholderScreen } from 'src/components';
import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

type CreateGalleryPostScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateGalleryPost'>;

export default function CreateGalleryPostScreen(
  props: CreateGalleryPostScreenProps,
) {
  useFocusEffect(
    useCallback(() => {
      props.navigation.getParent<CreateItemStackNavigationProp>().setOptions({
        headerRight: () => <Button title="Next" type="primary" size="medium" />,
      });
    }, [props.navigation]),
  );

  return <PlaceholderScreen />;
}
