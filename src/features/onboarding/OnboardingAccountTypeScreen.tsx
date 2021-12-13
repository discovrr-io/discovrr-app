import * as React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import * as constants from 'src/constants';
import { Button, Spacer, Text } from 'src/components';
import { OnboardingStackScreenProps } from 'src/navigation';

type OnboardingAccountTypeScreenProps =
  OnboardingStackScreenProps<'OnboardingAccountType'>;

export default function OnboardingAccountTypeScreen(
  props: OnboardingAccountTypeScreenProps,
) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Button
          title="Maybe Later"
          size="medium"
          overrideTheme="light-content"
          containerStyle={{
            flex: 1,
            alignItems: 'flex-end',
            paddingHorizontal: 0,
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}
        />
      ),
    });
  }, [props.navigation]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'flex-end',
          padding: constants.layout.spacing.xxl,
        }}>
        <View>
          <Text size="h2" weight="800" style={[styles.text]}>
            What best describes you?
          </Text>
          <Spacer.Vertical value="lg" />
          <Text style={[styles.text]}>You can always change this later</Text>
        </View>
        <Spacer.Vertical value="xl" />
        <OptionGroup
          value="user"
          onValueChanged={() => {}}
          options={[
            {
              label: "I'm a user",
              caption:
                'I want to purchase and engage in content by other users and makers.',
              value: 'user',
            },
            {
              label: "I'm a maker",
              caption:
                'I want to sell my products to an engaged local community.',
              value: 'maker',
            },
          ]}
        />
        <Spacer.Vertical value="xl" />
        <Button
          title="Next"
          variant="outlined"
          overrideTheme="light-content"
          containerStyle={{ borderColor: constants.color.absoluteWhite }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

type OptionGroupItem = {
  label: string;
  caption: string;
  value: string;
};

type OptionGroupProps = {
  value: string;
  onValueChanged: (newValue: string) => void | Promise<void>;
  options: (false | OptionGroupItem)[];
};

function OptionGroup(props: OptionGroupProps) {
  const [value, setValue] = React.useState(props.value);

  React.useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const handleValueChanged = (newValue: string) => {
    setValue(newValue);
    props.onValueChanged(newValue);
  };

  return (
    <View
      style={{
        borderColor: constants.color.absoluteWhite,
        borderWidth: constants.layout.border.thick,
        borderRadius: constants.layout.radius.lg,
        overflow: 'hidden',
      }}>
      {props.options
        .filter((option): option is OptionGroupItem => Boolean(option))
        .map((option, index, array) => (
          <View key={`${index}`}>
            <TouchableHighlight
              underlayColor={constants.color.accent}
              onPress={() => handleValueChanged(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: constants.layout.spacing.lg,
              }}>
              <React.Fragment>
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <Text size="xl" weight="bold" style={[styles.text]}>
                    {option.label}
                  </Text>
                  <Text size="sm" style={[styles.text]}>
                    {option.caption}
                  </Text>
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
                      ? constants.color.green300
                      : constants.color.absoluteWhite
                  }
                  size={36}
                />
              </React.Fragment>
            </TouchableHighlight>
            {index < array.length - 1 && (
              <View
                style={{
                  borderColor: constants.color.absoluteWhite,
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

const styles = StyleSheet.create({
  text: {
    color: constants.color.absoluteWhite,
  },
});
