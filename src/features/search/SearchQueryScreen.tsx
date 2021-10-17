import React from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

import { PlaceholderScreen } from 'src/components';

export default function SearchQueryScreen() {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <PlaceholderScreen />
    </TouchableWithoutFeedback>
  );
}
