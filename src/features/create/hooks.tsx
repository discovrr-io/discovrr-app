import * as React from 'react';

import { FormikContextType } from 'formik';
import { useFocusEffect, useNavigation } from '@react-navigation/core';

import { CreateItemStackNavigationProp } from 'src/navigation';
import { Button } from 'src/components';

export function useHandleSubmitNavigationButton<Values = any>(
  handleSubmit: FormikContextType<Values>['handleSubmit'],
) {
  const navigation = useNavigation();

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
