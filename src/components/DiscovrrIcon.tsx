import * as React from 'react';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import { IconProps } from 'react-native-vector-icons/Icon';

const DiscovrrIconSet = createIconSetFromFontello(
  require('../../assets/fonts/discovrr-icons-font-config.json'),
  'fontello',
  'DiscovrrIcons.ttf',
);

type DiscovrrIconProps = Omit<IconProps, 'name'>;

export default function DiscovrrIcon(props: DiscovrrIconProps) {
  return <DiscovrrIconSet name="discovrr-logo" {...props} />;
}
