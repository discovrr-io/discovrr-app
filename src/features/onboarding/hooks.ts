import * as React from 'react';
import { useNavigation } from '@react-navigation/core';

export function useDisableGoBackOnSubmitting(isSubmitting: boolean) {
  const navigation = useNavigation();

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (!isSubmitting) return;
      e.preventDefault();
    });

    return unsubscribe;
  }, [navigation, isSubmitting]);
}
