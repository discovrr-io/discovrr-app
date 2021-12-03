import * as React from 'react';
import {
  ImageResolvedAssetSource,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import FastImage, { FastImageProps } from 'react-native-fast-image';

import * as constants from 'src/constants';
import { Spacer } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AuthFormContainerProps = {
  title: string;
  coverImageSource: ImageResolvedAssetSource;
  caption?: {
    title?: string;
    body: string;
    image?: FastImageProps['source'];
  };
  children?: React.ReactChild | React.ReactChild[];
};

export default function AuthFormContainer(props: AuthFormContainerProps) {
  const { title, coverImageSource, caption, children } = props;
  const { top: topInset } = useSafeAreaInsets();
  const { colors } = useExtendedTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'position' })}
      style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingVertical: constants.layout.spacing.xxl,
        }}>
        <FastImage
          resizeMode="contain"
          source={{ uri: coverImageSource.uri }}
          style={{
            width: '100%',
            aspectRatio: coverImageSource.width / coverImageSource.height,
            marginTop: Platform.select({ android: topInset }),
          }}
        />
        <Spacer.Vertical value="xxl" />
        <View style={{ paddingHorizontal: constants.layout.spacing.xl }}>
          <View>
            <Text
              allowFontScaling={false}
              style={[constants.font.h2, { color: colors.text }]}>
              {title}
            </Text>
            {caption && (
              <View
                style={{
                  flexDirection: 'row',
                  paddingTop: constants.layout.spacing.xl,
                }}>
                {caption.image && (
                  <FastImage
                    source={caption.image}
                    style={{
                      width: 40,
                      aspectRatio: 1,
                      borderRadius: 20,
                      backgroundColor: colors.placeholder,
                      marginRight: constants.layout.spacing.lg,
                    }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  {caption.title && (
                    <Text
                      maxFontSizeMultiplier={1.2}
                      style={[
                        constants.font.largeBold,
                        { color: colors.text },
                      ]}>
                      {caption.title}
                    </Text>
                  )}
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={[constants.font.small, { color: colors.text }]}>
                    {caption.body}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <Spacer.Vertical value="lg" />
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
