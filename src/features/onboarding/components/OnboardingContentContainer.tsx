import * as React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import * as constants from 'src/constants';
import { Button, ButtonProps, Spacer, Text } from 'src/components';

type OnboardingContentContainerAction = Pick<
  ButtonProps,
  'title' | 'onPress' | 'loading' | 'loadingIndicatorColor' | 'underlayColor'
> & {
  mode?: 'persuasive' | 'hidden';
};

export type OnboardingContentContainerProps = {
  title: string;
  body: string | (false | string)[];
  renderHeader?: () => React.ReactNode;
  footerActions?: (false | OnboardingContentContainerAction)[];
  children?: React.ReactChild | React.ReactChild[];
};

export default function OnboardingContentContainer(
  props: OnboardingContentContainerProps,
) {
  const bodyText = React.useMemo(() => {
    return typeof props.body === 'string'
      ? props.body
      : props.body.filter(Boolean).join('\n');
  }, [props.body]);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        {props.renderHeader?.()}
        <View>
          <Text size="h2" weight="800" style={styles.text}>
            {props.title}
          </Text>
          <Spacer.Vertical value="lg" />
          <View>
            {bodyText.split('\n').map((text, index, array) => (
              <View key={`onboarding-content-container-body-${index}`}>
                <Text style={styles.text}>{text}</Text>
                {index < array.length - 1 && <Spacer.Vertical value="md" />}
              </View>
            ))}
          </View>
        </View>
        {props.children && (
          <>
            <Spacer.Vertical value="xl" />
            {props.children}
          </>
        )}
        {props.footerActions && (
          <>
            <Spacer.Vertical value="xl" />
            {props.footerActions
              .filter((action): action is OnboardingContentContainerAction =>
                Boolean(action),
              )
              .map((action, index, array) => (
                <View key={`onboarding-content-container-footer-${index}`}>
                  <Button
                    title={action.title}
                    onPress={action.onPress}
                    overrideTheme="light-content"
                    {...(action.mode === 'hidden'
                      ? {
                          size: 'small',
                          variant: 'text',
                        }
                      : {
                          size: 'large',
                          variant: 'outlined',
                          underlayColor: constants.color.accent,
                          containerStyle: {
                            borderColor: constants.color.absoluteWhite,
                          },
                        })}
                  />
                  {index < array.length - 1 && <Spacer.Vertical value="md" />}
                </View>
              ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: constants.layout.spacing.xxl,
  },
  text: {
    color: constants.color.absoluteWhite,
  },
});
