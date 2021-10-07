import React, { useCallback } from 'react';
import { Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import { AsyncGate, Card } from 'src/components';
import { color } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { Merchant, MerchantId } from 'src/models';
import { alertUnavailableFeature } from 'src/utilities';

import {
  CardElementOptions,
  CardElementProps,
} from 'src/components/cards/common';

import { useMerchant } from './hooks';

type MerchantItemCardProps = CardElementProps & {
  merchantId: MerchantId;
};

export default function MerchantItemCard(props: MerchantItemCardProps) {
  const { merchantId, ...cardElementPRops } = props;
  const merchantData = useMerchant(merchantId);

  return (
    <AsyncGate
      data={merchantData}
      onPending={() => <InnerMerchantItemCard.Pending {...cardElementPRops} />}
      onFulfilled={merchant => {
        if (!merchant) return null;
        return (
          <InnerMerchantItemCard merchant={merchant} {...cardElementPRops} />
        );
      }}
    />
  );
}

type InnerMerchantItemCardProps = CardElementProps & {
  merchant: Merchant;
};

const InnerMerchantItemCard = (props: InnerMerchantItemCardProps) => {
  const { merchant, ...cardElementProps } = props;

  const handlePressAuthor = () => {
    alertUnavailableFeature();
  };

  const renderCardBody = useCallback(
    (elementOptions: CardElementOptions) => {
      const coverPhoto = merchant.coverPhoto;
      const { width = 1, height = 1 } = coverPhoto ?? {};
      const aspectRatio = width / height; // Defaults to square (1 / 1 = 1)

      return (
        <View>
          <View>
            <Card.Indicator iconName="cart" position="top-right" />
            <FastImage
              resizeMode="contain"
              source={{ uri: merchant.coverPhoto?.url }}
              style={{
                width: '100%',
                height: undefined,
                aspectRatio,
                backgroundColor: color.placeholder,
              }}
            />
          </View>
          <View
            style={{
              paddingHorizontal: elementOptions.insetHorizontal,
              paddingVertical: elementOptions.insetVertical,
            }}>
            <Text
              numberOfLines={elementOptions.smallContent ? 2 : 4}
              style={[
                elementOptions.captionTextStyle,
                !merchant.biography && { fontStyle: 'italic' },
              ]}>
              {merchant.biography ?? 'No description'}
            </Text>
          </View>
        </View>
      );
    },
    [merchant.biography, merchant.coverPhoto],
  );

  return (
    <Card {...cardElementProps}>
      <Card.Body onPress={() => alertUnavailableFeature()}>
        {elementOptions => renderCardBody(elementOptions)}
      </Card.Body>
      <Card.Footer>
        <Card.Author
          avatar={merchant.avatar ?? DEFAULT_AVATAR}
          displayName={merchant.shortName}
          onPress={handlePressAuthor}
        />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={false}
            totalLikes={0}
            onToggleLike={() => alertUnavailableFeature()}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
};

// eslint-disable-next-line react/display-name
InnerMerchantItemCard.Pending = (props: CardElementProps) => {
  return (
    <Card {...props}>
      <Card.Body>{/* TODO: Add placeholder... */}</Card.Body>
      <Card.Footer {...props}>
        <Card.Author.Pending />
        <Card.Actions.Pending />
      </Card.Footer>
    </Card>
  );
};
