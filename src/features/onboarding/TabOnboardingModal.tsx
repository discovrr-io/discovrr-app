import * as React from 'react';
import { Modal, ModalBaseProps, SafeAreaView } from 'react-native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';

export default function TabOnboardingModal(props: ModalBaseProps) {
  return (
    <Modal transparent statusBarTranslucent animationType="fade" {...props}>
      <SafeAreaView
        style={{
          flexGrow: 1,
          backgroundColor:
            constants.color.absoluteBlack + utilities.percentToHex(0.5),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </Modal>
  );
}
