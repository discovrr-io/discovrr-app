import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as constants from 'src/constants';
import * as onboardingSlice from '../onboarding-slice';
import { Button, ButtonProps, Spacer, Text } from 'src/components';
import { useAppSelector, useExtendedTheme } from 'src/hooks';

const DEBUG = false;

type OnboardingContentContainerAction = Pick<
  ButtonProps,
  | 'disabled'
  | 'loading'
  | 'title'
  | 'onPress'
  | 'loading'
  | 'loadingIndicatorColor'
  | 'underlayColor'
>;

type OnboardingContentContainerFooterActions = (
  | false
  | OnboardingContentContainerAction
)[];

export type OnboardingContentContainerProps = {
  title: string;
  body: string | (false | string)[];
  page: number;
  useKeyboardAvoidingView?: boolean;
  footerActions?: OnboardingContentContainerFooterActions;
  children?: React.ReactNode;
};

export default function OnboardingContentContainer(
  props: OnboardingContentContainerProps,
) {
  const { useKeyboardAvoidingView = false } = props;
  const { dark } = useExtendedTheme();

  const pagesCount = useAppSelector(onboardingSlice.selectOnboardingPagesCount);

  const bodyText = React.useMemo(() => {
    return typeof props.body === 'string'
      ? props.body
      : props.body.filter(Boolean).join('\n');
  }, [props.body]);

  const ContainerView = React.useCallback(
    (props: { children: React.ReactNode }) => {
      if (useKeyboardAvoidingView) {
        return (
          <KeyboardAvoidingView
            behavior={Platform.select({
              ios: 'padding',
              default: 'height',
            })}
            style={[
              { flex: 1 },
              DEBUG && { borderWidth: 1, borderColor: 'blue' },
            ]}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                style={[
                  {
                    flex: 1,
                    justifyContent: 'space-between',
                    padding: constants.layout.spacing.xxl,
                  },
                  DEBUG && { borderWidth: 1, borderColor: 'green' },
                ]}>
                {props.children}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        );
      } else {
        return (
          <ScrollView
            style={[DEBUG && { borderWidth: 1, borderColor: 'red' }]}
            contentContainerStyle={[
              {
                flexGrow: 1,
                justifyContent: 'space-between',
                padding: constants.layout.spacing.xxl,
              },
              DEBUG && { borderWidth: 1, borderColor: 'green' },
            ]}>
            {props.children}
          </ScrollView>
        );
      }
    },
    [useKeyboardAvoidingView],
  );

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <ContainerView>
        <View>
          <Text size="sm" color="caption">
            {props.page} of {pagesCount}
          </Text>
          <Spacer.Vertical value="sm" />
          <Text size="h3" weight="800" allowFontScaling={false}>
            {props.title}
          </Text>
          <Spacer.Vertical value="md" />
          <View>
            {bodyText.split('\n').map((text, index, array) => (
              <View key={`onboarding-content-container-body-${index}`}>
                <Text allowFontScaling={false}>{text}</Text>
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
                    type="primary"
                    variant="contained"
                    title={action.title}
                    disabled={action.disabled}
                    loading={action.loading}
                    onPress={action.onPress}
                  />
                  {index < array.length - 1 && <Spacer.Vertical value="md" />}
                </View>
              ))}
          </>
        )}
      </ContainerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  // scrollView: {
  //   flexGrow: 1,
  //   justifyContent: 'space-between',
  //   padding: constants.layout.spacing.xxl,
  // },
});
