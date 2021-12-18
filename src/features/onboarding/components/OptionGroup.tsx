import * as React from 'react';
import { TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import * as constants from 'src/constants';
import { Spacer, Text, TextProps } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

export type OptionGroupItem<Value extends string> = {
  label: string;
  caption?: string;
  value: Value;
};

export type OptionGroupProps<Value extends string> = {
  value: Value | undefined | null;
  onValueChanged: (newValue: Value) => void | Promise<void>;
  options: (false | OptionGroupItem<Value>)[];
  size?: 'large' | 'small';
  labelProps?: TextProps;
  captionProps?: TextProps;
};

export default function OptionGroup<Value extends string>(
  props: OptionGroupProps<Value>,
) {
  const [value, setValue] = React.useState(props.value);
  const { colors } = useExtendedTheme();
  const isSmall = props.size === 'small';

  React.useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const handleValueChanged = (newValue: Value) => {
    setValue(newValue);
    props.onValueChanged(newValue);
  };

  return (
    <View
      style={{
        borderColor: colors.border,
        borderWidth: constants.layout.border.thick,
        borderRadius: constants.layout.radius.lg,
        overflow: 'hidden',
      }}>
      {props.options
        .filter((option): option is OptionGroupItem<Value> => Boolean(option))
        .map((option, index, array) => (
          <View key={`${index}`}>
            <TouchableHighlight
              underlayColor={colors.highlight}
              onPress={() => handleValueChanged(option.value)}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical:
                    constants.layout.spacing[isSmall ? 'md' : 'lg'],
                  paddingHorizontal: constants.layout.spacing.lg,
                },
                isSmall &&
                  index === 0 && {
                    paddingTop: constants.layout.spacing.md * 1.25,
                  },
                isSmall &&
                  index === array.length - 1 && {
                    paddingBottom: constants.layout.spacing.md * 1.25,
                  },
              ]}>
              <React.Fragment>
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <Text
                    size={isSmall ? 'md' : 'xl'}
                    weight="bold"
                    {...props.labelProps}>
                    {option.label}
                  </Text>
                  {option.caption && (
                    <React.Fragment>
                      <Spacer.Vertical value={isSmall ? 'xs' : 'sm'} />
                      <Text
                        size={isSmall ? 'xs' : 'sm'}
                        {...props.captionProps}>
                        {option.caption}
                      </Text>
                    </React.Fragment>
                  )}
                </View>
                <Spacer.Horizontal value="md" />
                <Icon
                  name={
                    value === option.value
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  color={
                    value === option.value
                      ? constants.color.green500
                      : colors.border
                  }
                  size={isSmall ? 30 : 36}
                />
              </React.Fragment>
            </TouchableHighlight>
            {index < array.length - 1 && (
              <View
                style={{
                  borderColor: colors.border,
                  borderBottomWidth: constants.layout.border.thick,
                  marginHorizontal: constants.layout.spacing.lg,
                }}
              />
            )}
          </View>
        ))}
    </View>
  );
}
