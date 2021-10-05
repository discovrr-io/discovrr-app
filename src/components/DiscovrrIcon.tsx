import React from 'react';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import { IconProps } from 'react-native-vector-icons/Icon';

const fontelloConfig = require('../../assets/discovrr-icons-font-config.json');
const DiscovrrIconSet = createIconSetFromFontello(fontelloConfig);

type DiscovrrIconProps = Omit<IconProps, 'name'>;

export default function DiscovrrIcon(props: DiscovrrIconProps) {
  return <DiscovrrIconSet name="discovrr-logo" {...props} />;
}
