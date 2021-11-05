import * as React from 'react';

import { useFormikContext } from 'formik';
import { useFocusEffect, useNavigation } from '@react-navigation/core';

import { CreateItemStackNavigationProp } from 'src/navigation';
import { Button } from 'src/components';

export function useHandleSubmitNavigationButton<Values = any>() {
  const navigation = useNavigation();
  const { handleSubmit } = useFormikContext<Values>();

  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent<CreateItemStackNavigationProp>().setOptions({
        headerRight: () => (
          <Button
            title="Next"
            type="primary"
            size="medium"
            onPress={handleSubmit}
          />
        ),
      });

      return () => {
        navigation.getParent<CreateItemStackNavigationProp>().setOptions({
          headerRight: undefined,
        });
      };
    }, [navigation, handleSubmit]),
  );
}
