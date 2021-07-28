import React from 'react';
import { Platform, Text, View } from 'react-native';

/**
 * @param {import('react-native').ViewProps} props
 */
export default function DeveloperNote(props) {
  // if (Platform.OS === 'ios') return null;

  return (
    <View style={props.style}>
      <Text style={{ fontStyle: 'italic', fontWeight: '700' }}>
        A note from the developer:
      </Text>
      <Text style={{ fontStyle: 'italic' }}>
        We are working on a redesigned version of this page based on your
        feedback. Please excuse any hiccups you may encounter in the meantime.
      </Text>
    </View>
  );
}
